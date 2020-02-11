import _ from 'underscore';
import buildRegExp from '../../lib/components/searchRegex';

//Search function.
SearchSource.defineSource('listings', function(search, options) {
  if(search) {
    let regExp = buildRegExp(search);

    let selector = {
      title: regExp,
      sold: false,
      active: true,
      $or:[{ 
        expiryDate: {
          $gt: new Date()
        }
      },{
        expiryDate: null
      }]
    }

    if ( options.distance !== null && options.coordinates !== null ){
      selector = _.extend(selector,{
        hasLocation: true,
        location: {
          $geoWithin: {
            $centerSphere: [
              [ options.coordinates[0], options.coordinates[1] ],
              options.distance / 6371
            ]
          }
        }
      });
    }

    var result = Listings.find(
      selector,
      {
        fields: {
          score: { $meta: "textScore" }
        },
        sort: {
          score: { $meta: "textScore" },
          listOfferCount: -1,
          views: -1,
          listingsCount: -1,
          postDate: -1,
          title: 1,
        },
        limit: 10,
        skip: options.skip
      });

      return {
        data: result.fetch(),
        metadata: { count: result.count() }
      }
  }
  else {
    if ( options.distance !== null && options.coordinates !== null ){
      let limit = {
        hasLocation: true,
        location: {
          $geoWithin: {
            $centerSphere: [
              [ options.coordinates[0], options.coordinates[1] ],
              options.distance / 6371
            ]
          }
        }
      }
      var result = Listings.find(limit, { limit: 10, skip: options.skip }).fetch();

      return {
        data: result.fetch(),
        metadata: {count: result.count()}
      }
    }
    else {
      var result = Listings.find({},{ limit: 10, skip: options.skip }).fetch();

      return {
        data: result.fetch(),
        metadata: {count: result.count()}
      }
    }
  }
});
