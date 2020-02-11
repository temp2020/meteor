import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';
import buildRegExp from '../../lib/components/searchRegex';
import { searchCardDistance } from '../../lib/components/search-card-distance';

Listings._ensureIndex({
  "title": "text"
});

Stores._ensureIndex({
  "name": "text"
});

//Main - Shop
Meteor.publish('shopMain', function(setlimit) {
  check(setlimit, Match.Integer);
  return Products.find({
    listingsCount: { $gt: 0 },
  },{
    sort: {
      name: 1
    },
    fields: {
      productSoldCount: false,
      launched: false
    },
    limit: setlimit
  });
});

//Main - Stores
Meteor.publishComposite('storesMain', function(search, coordinates, setlimit) {
  check(setlimit, Match.Integer);
  check(coordinates, Match.OneOf(null, [Number]));
  check(search, Match.Maybe(String));

  let self = this;

  let selector = {
    listingsCount: { 
      $gt: 0 
    },
    active: true
  }

  let options = {
    sort: {
      lastPost: -1,
      name: 1
    },
    fields: {
      score: { $meta: "textScore" },
      storeText: false,
      nameText: false
    },
    limit: setlimit
  }
  
  if(search){

    options.sort = {
      score: { $meta: "textScore" },
      lastPost: -1,
      name: 1
    }
    
    let listings = [];

    if (coordinates) {

      const maxDistance = searchCardDistance(this.userId);

      let listingSelector = {
        title: buildRegExp(search),
        active: true,
        isPublished: true,
        hasLocation: true,
        location: {
          $geoWithin: {
            $centerSphere: [
              [ coordinates[0], coordinates[1] ],
              maxDistance / 6371
            ]
          }
        },
        $or:[{ 
          expiryDate: {
            $gt: new Date()
          }
        },{
          expiryDate: null
        }]
      };
      
      let user = null;
    
      if (this.userId) {
        user = Profile.findOne({ profID: this.userId });
      }
  
      if( user && user.location && user.location.countryCode ) {
        listingSelector.country = user.location.countryCode;
      }
  
      listings = Listings.find(
        listingSelector, 
        {
          fields: {
            score: { $meta: "textScore" },
            storeId: true
          },
          sort: {
            score: { $meta: "textScore" }
          },
        })
        .fetch();

    }

    if(listings.length > 0){

      listingIds = listings.map( listing => { return listing.storeId });

      listingIds = _.uniq(listingIds);

      selector = {
        $or:[{ 
          name: buildRegExp(search)
        },{ 
          _id: {
            $in: listingIds
          } 
        }],
        listingsCount: { 
          $gt: 0 
        },
        active: true
      }

    }
    else{

      selector.name = buildRegExp(search);

    }
  }

  return {
    find: function() {

      return Stores.find(selector, options);

    },
    children: [{
      find: function(store) {
        if( !self.userId ){

          return;

        }
        else {

          return Favorites.find({
            storeId: store._id,
            userId: self.userId
          },{
            fields: {
              storeId: true,
              userId: true
            }
          });

        }
      }
    }]
  }

});

Meteor.publishComposite('favoriteStores', function(search, coordinates, setlimit) {
  check(setlimit, Match.Integer);
  check(coordinates, Match.OneOf(null, [Number]));
  check(search, Match.Maybe(String));
  check(this.userId, String);
  
  let self = this;

  return {
    find: function() {
      return Favorites.find({
        userId: self.userId
      },{
        fields: {
          storeId: true,
          userId: true,
          date: true
        },
        sort: {
          date: -1
        }
      });
    },
    children: [{
      find: function(favorite) {

        let selector = {
          _id: favorite.storeId,
          listingsCount: { 
            $gt: 0 
          },
          active: true
        };

        let options = {
          sort: {
            lastPost: -1,
            name: 1
          },
          fields: {
            score: { $meta: "textScore" },
            storeText: false,
            nameText: false
          },
          limit: setlimit
        }

        if (search) {
          
          options.sort = {
            score: { $meta: "textScore" },
            lastPost: -1,
            name: 1
          }

          let listing = null;

          if (coordinates) {

            const maxDistance = searchCardDistance(this.userId);

            let listingSelector = {
              title: buildRegExp(search),
              storeId: favorite.storeId,          
              active: true,
              isPublished: true,
              hasLocation: true,
              location: {
                $geoWithin: {
                  $centerSphere: [
                    [ coordinates[0], coordinates[1] ],
                    maxDistance / 6371
                  ]
                }
              },
              $or:[{ 
                expiryDate: {
                  $gt: new Date()
                }
              },{
                expiryDate: null
              }]
            }
  
            let user = null;
    
            if (this.userId) {
              user = Profile.findOne({ profID: this.userId });
            }
        
            if( user && user.location && user.location.countryCode ) {
              listingSelector.country = user.location.countryCode;
            }
  
            listing = Listings.findOne(
              listingSelector,
              {
                fields: {
                  storeId: true
                }
              });
          }
          

          if( listing ){
                       
            let selector = {
              $or:[{
                _id: favorite.storeId,
                name: buildRegExp(search)
              },{
                _id: listing.storeId
              }],
              listingsCount: { 
                $gt: 0 
              },
              active: true
            };

          }
          else {

            selector.name = buildRegExp(search);
            
          }
        }

        return Stores.find(selector, options);

      }
    }]
  }

});

Meteor.publish('storeDetails', function(storeId){
  check(storeId, String);

  return Stores.find({ _id: storeId, active: true }, { limit: 1 });
});

// Listings Index
Meteor.publishComposite('listingIndex', function(type, groupId, options) {
  check(type, String);
  check(options, {
    loaded: Number,
    skip: Number,
    distance: Match.OneOf(null, Number),
    coordinates: Match.OneOf(null, [Number]),
    sort: String,
    minPrice: Match.OneOf(null, Number),
    maxPrice: Match.OneOf(null, Number),
    condition: [String],
    search: Match.Optional(String),
    sameCurrency: Boolean
  });

  const self = this;
  let user = null;

  if( type === 'store' && type === 'category' ){
    check(groupId, String);
  }

  if (!options.coordinates) {
    throw new Meteor.Error('GPS Required');
  }

  if( type !== 'store' && type !== 'category' && type !== 'follow' && type !== 'search' ){
    throw new Meteor.Error('Invalid Type');
  }

  if( options.minPrice && options.maxPrice && (options.minPrice > options.maxPrice) ){
    throw new Meteor.Error('Min Price cannot be greater than Max Price.');
  }

  const maxDistance = searchCardDistance(this.userId);
  
  if (this.userId) {
    user = Profile.findOne({ profID: this.userId });
  }

  let selector = {
    active: true,
    isPublished: true,
    $or:[{ 
      expiryDate: {
        $gt: new Date()
      }
    },{
      expiryDate: null
    }]
  }

  let settings = {
    skip: options.skip,
    limit: options.loaded,
    fields: {
      _id: true,
      title: true,
      condition: true,
      productID: true,
      storeId: true,
      active: true,
      sold: true,
      sellPrice: true,
      postDate: true,
      images: true,
      listedBy: true,
      location:true,
      hasLocation: true,
      expiryDate: true,
      currency: true,
      isPublished: true
    }
  }

  if( type === 'category' ){
    selector.productID = groupId;
  }
  else if( type === 'store' ){
    selector.storeId = groupId;
  }
  else if(type === 'follow'){
    let listingIds = [];

    let follows = Follows.find({
      userId: this.userId,
    },{
      fields: {
        listingId: true
      }
    });
    
    listingIds = follows.map( follow => { return follow.listingId });
    
    listingIds = _.uniq(listingIds);

    selector._id = {
      $in: listingIds
    }
  }

  if( !options.distance || options.distance > maxDistance ) {
    options.distance = maxDistance;
  }

  if( user && user.location && user.location.countryCode ) {
    selector.country = user.location.countryCode;
  }
  
  if( options.search ){
    selector.title = buildRegExp(options.search);
    
    settings.fields = _.extend(settings.fields,{
      score: { $meta: "textScore" }
    });
  }

  if( options.condition.length > 0 ){
    selector.condition = {
      $in: options.condition
    }
  }

  if( options.minPrice && !options.maxPrice  ){
    selector.sellPrice = {
      $gte: options.minPrice
    }
  }

  if( !options.minPrice && options.maxPrice ){
    selector.sellPrice = {
      $lte: options.maxPrice
    }
  }

  if( options.minPrice && options.maxPrice ){
    selector.sellPrice = {
      $gte: options.minPrice,
      $lte: options.maxPrice
    }
  }

  if( options.sort === 'date' ){

    settings.sort = options.search ? { score: { $meta: "textScore" }, postDate: -1 } : { postDate: -1 };
  
  }
  else if( options.sort === 'priceMin' ){

    settings.sort = options.search ? { score: { $meta: "textScore" }, sellPrice: 1 } : { sellPrice: 1 };
  
  }
  else if( options.sort === 'priceMax' ){

    settings.sort = options.search ? { score: { $meta: "textScore" }, sellPrice: -1 } : { sellPrice: -1 };
  
  }


  if ( options.distance !== null && options.coordinates !== null && options.sort !== 'distance' ){
    
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
  else if ( options.distance !== null && options.coordinates !== null && options.sort === 'distance' ){
    
    selector = _.extend(selector,{
      hasLocation: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [ options.coordinates[0], options.coordinates[1] ]
          },
          $maxDistance: options.distance * 1000
        }
      }
    });
    
    if(options.search){

      settings.sort = { score: { $meta: "textScore" } };

    }

  }
  else if ( options.distance === null && options.coordinates !== null && options.sort === 'distance' ){
    
    selector = _.extend(selector,{
      hasLocation: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [ options.coordinates[0], options.coordinates[1] ]
          },
          $minDistance: 0
        }
      }
    });

    if(options.search){

      settings.sort = { score: { $meta: "textScore" } };

    }
    
  }

  return {
    find: function() {
      return Listings.find(
        selector,
        settings
      );
    },
    children: [{
      find: function(listing) {
        return Offers.find({
          listingID: listing._id
        },{
          fields: {
            buyer: false,
            offerBy: false
          },
          sort: {
            offerAmount: -1,
            offerDate: 1
          },
          limit: 1
        });
      }
    },{
      find: function(listing) {
        return Uploads.collection.find({ 'meta.listID': listing._id },{
          fields: {
            name: false,
            extension: false,
            path: false,
            type: false,
            size: false,
            versions: false,
            isVideo: false,
            isAudio: false,
            isImage: false,
            isText: false,
            isJSON: false,
            isPDF: false,
            _storagePath: false,
            public: false
          },
          limit: 1
        });
      }
    },{
      find: function(listing) {
        if( type === 'follow' ){
          
          return Follows.find({
            userId: self.userId,
          },{
            fields: {
              listingId: true,
              userId: true
            }
          });
          
        }
      }
    }]
  }
});

//Main - Offers
Meteor.publishComposite('myOfferIndex', function(options) {
  check(options, {
    loaded: Number,
    skip: Number
  });
  return {
    find: function() {
      return Offers.find({
        offerBy: this.userId,
      },{
        sort: { offerDate: -1 },
        skip: options.skip,
        limit: options.loaded
      });
    },
    children: [{
      find: function(offer) {
        return Listings.find({
          _id: offer.listingID,
          active: true,
          isPublished: true,
          $or:[{ 
            expiryDate: {
              $gt: new Date()
            }
          },{
            expiryDate: null
          }]
        },{
          limit: options.loaded,
          fields: {
            _id: true,
            title: true,
            condition: true,
            productID: true,
            active: true,
            sold: true,
            sellPrice: true,
            postDate: true,
            images: true,
            listedBy: true,
            location:true,
            hasLocation: true,
            expiryDate: true,
            currency: true
          }
        });
      },
      children: [{
        find: function(listing, offer) {
          return Offers.find({
            listingID: listing._id
          },{
            fields: {
              buyer: false,
              offerBy: false,
            },
            sort: {
              offerAmount: -1,
              offerDate: 1
            },
            limit: 1
          });
        },
      },{
        find: function(listing) {
          return Uploads.collection.find({ 'meta.listID': listing._id },{
              fields: {
                name: false,
                extension: false,
                path: false,
                type: false,
                size: false,
                versions: false,
                isVideo: false,
                isAudio: false,
                isImage: false,
                isText: false,
                isJSON: false,
                isPDF: false,
                _storagePath: false,
                public: false
              },
              limit: 1
            });
        }
      }]
    }]
  }
});


//Main - Sell
Meteor.publishComposite('myPosts', function(options) {
  check(options, {
    loaded: Number,
    skip: Number
  });
  return{
    find: function() {
      return Listings.find({
        listedBy: this.userId,
        active: true,
        $or:[{ 
          expiryDate: {
            $gt: new Date()
          }
        },{
          expiryDate: null
        }]
      },{
        sort: { postDate: -1 },
        skip: options.skip,
        limit: options.loaded,
        fields: {
          _id: true,
          title: true,
          views: true,
          condition: true,
          productID: true,
          active: true,
          sold: true,
          sellPrice: true,
          postDate: true,
          images: true,
          listedBy: true,
          expiryDate: true,
          currency: true
        }
      });
    },
    children: [{
      find: function(listing) {
        return Offers.find({
          listingID: listing._id
        },{
          fields: {
            buyer: false,
            offerBy: false
          },
          sort: {
            offerAmount: -1,
            offerDate: 1
          },
          limit: 1
        });
      }
    },{
      find: function(listing) {
        return Uploads.collection.find({ 'meta.listID': listing._id },{
            fields: {
              name: false,
              extension: false,
              path: false,
              type: false,
              size: false,
              versions: false,
              isVideo: false,
              isAudio: false,
              isImage: false,
              isText: false,
              isJSON: false,
              isPDF: false,
              _storagePath: false,
              public: false
            },
            limit: 1
          });
      }
    }]
  }
});

Meteor.publish('selectModel', function(setlimit) {
  check(setlimit, Match.Integer);
  return Products.find({},{
    sort: {
      productOffersCount: -1,
      year: -1,
      listingsCount: -1,
      name: 1
    },
    fields: {
      productSoldCount: false,
      launched: false,
      category: false
    },
    limit: setlimit
  });
});

Meteor.publish('searchListing', function(id) {
  check(id, String);
  return [
    Listings.find({
      _id: id,
      active: true,
      isPublished: true,
      $or:[{ 
        expiryDate: {
          $gt: new Date()
        }
      },{
        expiryDate: null
      }]
    },{
      sort: { postDate: -1 },
      limit: 1,
      fields: {
        _id: true,
        title: true,
        condition: true,
        productID: true,
        active: true,
        sold: true,
        sellPrice: true,
        postDate: true,
        images: true,
        listedBy: true,
        location:true,
        expiryDate: true,
        currency: true
      }
    }),
    Uploads.collection.find({ 'meta.listID': id },{
        fields: {
          name: false,
          extension: false,
          path: false,
          type: false,
          size: false,
          versions: false,
          isVideo: false,
          isAudio: false,
          isImage: false,
          isText: false,
          isJSON: false,
          isPDF: false,
          _storagePath: false,
          public: false
        },
        limit: 1
      })
  ]
});

Meteor.publish('currencies', function() {
  return Currencies.find();
});