import React from 'react';
import Helmet from 'react-helmet';
import L from 'leaflet';

import Layout from 'components/Layout';
import Map from 'components/Map';


const LOCATION = {
  lat: 38.9072,
  lng: -77.0369
};
const CENTER = [LOCATION.lat, LOCATION.lng];
const DEFAULT_ZOOM = 1;

const IndexPage = () => {
  /**
   * mapEffect
   * @description Fires a callback once the page renders
   * @example Here this is and example of being used to zoom in and set a popup on load
   */

  async function mapEffect({ leafletElement } = {}) {
    if ( !leafletElement ) return;
    let route, routeJson;
    try {
      route = await fetch('https://firebasestorage.googleapis.com/v0/b/santa-tracker-firebase.appspot.com/o/route%2Fsanta_en.json?alt=media&2018b');
      routeJson = await route.json();
    } catch(e) {
      console.log(`Failed to find Santa!: ${e}`);
    }
    console.log("routeJson", routeJson);
    const { destinations = [] } = routeJson || {};
    const destinationsVisited = destinations.filter(({arrival}) => arrival < Date.now());
    const destinationsWithPresents = destinationsVisited.filter(({presentsDelivered}) => presentsDelivered > 0);
    const lastKnownDestination = destinationsWithPresents[destinationsWithPresents.length - 1]
    if ( destinationsWithPresents.length === 0 ) {
      // Create a Leaflet Market instance using Santa's LatLng location
      const center = new L.LatLng( 0, 0 );
      const noSanta = L.marker( center, {
        icon: L.divIcon({
          className: 'icon',
          html: `<div class="icon-santa">🎅</div>`,
          iconSize: 50
        })
      });
      noSanta.addTo( leafletElement );
      noSanta.bindPopup( `Santa's still at the North Pole!` );
      noSanta.openPopup();
      return;
    }
    const santaLocation = new L.LatLng( lastKnownDestination.location.lat, lastKnownDestination.location.lng );

    const santaMarker = L.marker( santaLocation, {
      icon: L.divIcon({
        className: 'icon',
        html: `<div class='icon-santa'>🎅</div>`,
        iconSize: 50
      })
    });
    
    santaMarker.addTo(leafletElement);
    
    const santasRouteLatLngs = destinations.map(destination => {
      const { location } = destination;
      const { lat, lng } = location;
      return new L.LatLng( lat, lng );
    });

    const stopsGeoJson = geoJsonPointsFromDestinations(destinationsWithPresents)
    
    function geoJsonPointsFromDestinations( desintations = []) {
      const features = desintations.map(( destination = {}) => {
        const { location = {} } = destination;
        const { lat, lng } = location;
        const coordinates = [lng, lat];
        return {
          type: 'Feature',
          properties: {
            ...destination
          },
          geometry: {
            type: 'Point',
            coordinates
          }
        };
      });
      return {
        features
      };
    }

    const giftIcon = L.divIcon({
      className: 'icon',
      html: `<div class='icon-dest'>🎁</div>`,
      iconSize: 30
    })

    function deliveryPointToLayer( feature = {}, latlng ) {
      const { properties = {} } = feature;
      const { presentsDelivered = 0, city, region } = properties;
      const quote = `
        <div class="text-center">
          <strong>${city}, ${region}</strong>
          <br /><hr />
          ${presentsDelivered.toLocaleString('en-IN').replace('.00','')} 🎁
        </div>
      `;
      const layer = L.marker( latlng, {
        icon: giftIcon,
        riseOnHover: true
      }).bindPopup( quote );
      return layer;
    }

    const santaStops = new L.geoJson( stopsGeoJson, { pointToLayer: deliveryPointToLayer
    });

    // const destinationsMarker = L.marker( dest, {
    //   icon: L.divIcon({
    //     className: 'icon',
    //     html: `<div class='icon-dest'>🎁</div>`,
    //     iconSize: 30
    //   })
    // });
    
    santaStops.addTo(leafletElement);
        
    const santasRoute = new L.Polyline( santasRouteLatLngs, {
      weight: 2.5,
      color: '#fc4a1a',
      opacity: 1,
      fillColor: '#fc4a1a',
      fillOpacity: 0.5
    });
    
    santasRoute.addTo(leafletElement);
  }

  const mapSettings = {
    center: CENTER,
    defaultBaseMap: 'OpenStreetMap',
    zoom: DEFAULT_ZOOM,
    mapEffect
  };

  return (
    <Layout pageName="home">
      <Helmet>
        <title>Home Page</title>
      </Helmet>
      <Map {...mapSettings} />
    </Layout>
  );
};

export default IndexPage;
