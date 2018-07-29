if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() { // idb not defined this line
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
          // Registration was successful
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
          // registration failed :(
          console.log('ServiceWorker registration failed: ', err);
      });
  });
}
const DATA_PORT = 1337; // Change this to your server port
const RESTAURANTS_URL = `http://localhost:${DATA_PORT}/restaurants/`;

var idbApp = (function() {
  'use strict';
  // check for support
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  var dbPromise = idb.open('restaurantDB', 2, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        // a placeholder case so that the switch block will
        // execute when the database is first created
        // (oldVersion is 0)
      case 1:
        console.log('Creating the restaurant object store');
        upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
     
    }
  });

  function storeRestaurants() {
    
   
    //fetch(RESTAURANTS_URL, {mode: 'cors'})
    fetch(RESTAURANTS_URL)
    // make the response JSON data
    .then(function (response) {
      return response.json();
      })
    // put the JSON data in restaurants  
    .then (function(restaurants){
      console.log("restaurant JSON", restaurants);
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          store.put(restaurant)
    
        });
      });
      // now return it
      console.log("restaurants  ", restaurants);
      callback(null, restaurants);
      })
    .catch(function (err) {
        const error = (`Unable to store restaurants ${err}`);
      });
    
  } 


    function mygetAll(){
      dbPromise.then(function(db) {
        var tx = db.transaction('restaurants', 'readonly');
        var store = tx.objectStore('restaurants');
        return store.getAll();
      }).then(function(items) {
        console.log('Restaurants by name:', items);
      });
    }
  
  return {
    dbPromise: (dbPromise),
    storeRestaurants: (storeRestaurants),
    mygetAll: (mygetAll)
  };
})();




class DBHelper {
/**
 * Restaurant JSON URL.
 * Change this to restaurants.json file location on your server.
 */
static get RESTAURANTS_URL() {
  const port = 1337 // Change this to your server port
  return `http://localhost:${port}/restaurants`;
}

static fetchRestaurants(callback){
  // Get the restaurants from restaurantDB
   idbApp.storeRestaurants();
   
    // if no restaurants, get them from the server
    
      fetch(RESTAURANTS_URL)
      // since the response is json add to json response obj
        .then(function(response){
          return response.json();
        })
        .then (function(restaurants){
          console.log("server restaurant JSON", restaurants)
          callback(null, restaurants)
        })
        .catch(err => {
            callback('Request failed. Returned ${err}', null);
        });
      
 }
/**
 * Fetch a restaurant by its ID.
 */
static fetchRestaurantById(id, callback) {
  // fetch all restaurants with proper error handling.
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null); 
    } else {
      // find the restaurant that matches the id sent
      const restaurant = restaurants.find(r => r.id == id);
      if (restaurant) { // Got the restaurant
        callback(null, restaurant);
      } else { // Restaurant does not exist in the database
        callback('Restaurant does not exist', null);
      }
    }
  });
}

/**
 * Fetch restaurants by a cuisine type with proper error handling.
 */
static fetchRestaurantByCuisine(cuisine, callback) {
  // Fetch all restaurants  with proper error handling
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Filter restaurants to have only given cuisine type
      const results = restaurants.filter(r => r.cuisine_type == cuisine);
      callback(null, results);
    }
  });
}

/**
 * Fetch restaurants by a neighborhood with proper error handling.
 */
static fetchRestaurantByNeighborhood(neighborhood, callback) {
  // Fetch all restaurants
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Filter restaurants to have only given neighborhood
      const results = restaurants.filter(r => r.neighborhood == neighborhood);
      callback(null, results);
    }
  });
}

/**
 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
 */
static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
  // Fetch all restaurants
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      let results = restaurants;
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      callback(null, results);
    }
  });
}

/**
 * Fetch all neighborhoods with proper error handling.
 */
static fetchNeighborhoods(callback) {
  // Fetch all restaurants
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
      callback(null, uniqueNeighborhoods);
    }
  });
}

/**
 * Fetch all cuisines with proper error handling.
 */
static fetchCuisines(callback) {
  // Fetch all restaurants
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      callback(null, uniqueCuisines);
    }
  });
}

/**
 * Restaurant page URL.
 */
static urlForRestaurant(restaurant) {
  return (`./restaurant.html?id=${restaurant.id}`);
}

/**
 * Restaurant image URL.
 */
static imageUrlForRestaurant(restaurant) {

  if(restaurant.photograph==undefined){
    return '../img/10.jpg'
}else{
  return (`/img/${restaurant.photograph}` + '.jpg');
  }
}
/**
 * Map marker for a restaurant.
 */

  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
    position: restaurant.latlng,
    title: restaurant.name,
    url: DBHelper.urlForRestaurant(restaurant),
    map: map,
    animation: google.maps.Animation.DROP}
  );
  return marker;
}

}

