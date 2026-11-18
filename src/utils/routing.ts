export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  type: 'depart' | 'turn' | 'continue' | 'arrive';
  modifier?: 'left' | 'right' | 'straight' | 'slight right' | 'slight left' | 'uturn';
}

export interface NavigationRoute {
  coordinates: [number, number][]; // [lat, lng] array for Leaflet polyline
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  steps: RouteStep[];
}

/**
 * Creates a synthetic street-grid waypoint path between two coordinates
 * used as an instant offline/fallback route
 */
function createFallbackGridRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  destName: string
): NavigationRoute {
  // Generate realistic intermediate corner turns along the street grid
  const midLat = startLat + (endLat - startLat) * 0.45;
  const midLng = startLng + (endLng - startLng) * 0.55;

  const coords: [number, number][] = [
    [startLat, startLng],
    [midLat, startLng],
    [midLat, midLng],
    [endLat, midLng],
    [endLat, endLng],
  ];

  // Calculate distance
  const dLat = (endLat - startLat) * 111000;
  const dLng = (endLng - startLng) * 111000 * Math.cos((startLat * Math.PI) / 180);
  const totalMeters = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 1.15);
  const totalMinutes = Math.max(1, Math.round(totalMeters / 80));

  const steps: RouteStep[] = [
    {
      instruction: 'Start walking along the pedestrian sidewalk',
      distanceMeters: Math.round(totalMeters * 0.35),
      type: 'depart',
      modifier: 'straight',
    },
    {
      instruction: endLng > startLng ? 'Turn right toward the main pedestrian walkway' : 'Turn left toward the main walkway',
      distanceMeters: Math.round(totalMeters * 0.45),
      type: 'turn',
      modifier: endLng > startLng ? 'right' : 'left',
    },
    {
      instruction: `Arrive at ${destName} on your ${endLng > startLng ? 'right' : 'left'}`,
      distanceMeters: Math.round(totalMeters * 0.2),
      type: 'arrive',
      modifier: 'straight',
    },
  ];

  return {
    coordinates: coords,
    totalDistanceMeters: totalMeters,
    totalDurationMinutes: totalMinutes,
    steps,
  };
}

/**
 * Fetches real walking route from Open Source Routing Machine (OSRM)
 * with automatic fast fallback to street-grid path
 */
export async function getWalkingRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  destName: string
): Promise<NavigationRoute> {
  const url = `https://router.project-osrm.org/route/v1/walking/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM GeoJSON is [lng, lat], Leaflet polyline expects [lat, lng]
        const rawCoords: [number, number][] = route.geometry.coordinates;
        const coordinates: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

        const totalDistanceMeters = Math.round(route.distance);
        const totalDurationMinutes = Math.max(1, Math.round(route.duration / 60));

        // Format turn steps
        const steps: RouteStep[] = [];
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          route.legs[0].steps.forEach((st: any) => {
            const maneuver = st.maneuver || {};
            let instruction = st.name ? `Walk on ${st.name}` : 'Continue straight';

            if (maneuver.type === 'depart') {
              instruction = `Head ${maneuver.modifier || ''} on ${st.name || 'the walkway'}`;
            } else if (maneuver.type === 'turn') {
              instruction = `Turn ${maneuver.modifier || ''} onto ${st.name || 'the path'}`;
            } else if (maneuver.type === 'arrive') {
              instruction = `Arrive at ${destName}`;
            }

            steps.push({
              instruction,
              distanceMeters: Math.round(st.distance),
              type: maneuver.type || 'turn',
              modifier: maneuver.modifier,
            });
          });
        }

        if (steps.length === 0) {
          steps.push(
            { instruction: 'Head toward station', distanceMeters: Math.round(totalDistanceMeters * 0.7), type: 'depart' },
            { instruction: `Arrive at ${destName}`, distanceMeters: Math.round(totalDistanceMeters * 0.3), type: 'arrive' }
          );
        }

        return {
          coordinates,
          totalDistanceMeters,
          totalDurationMinutes,
          steps,
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing fallback used:', err);
  }

  // Graceful fallback
  return createFallbackGridRoute(startLat, startLng, endLat, endLng, destName);
}
