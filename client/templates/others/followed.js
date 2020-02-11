import { Meteor } from 'meteor/meteor';
import { myCoordinates } from '../../components/my-coordinates';
import { searchCardDistance } from '../../../lib/components/search-card-distance';

angular
    .module('salephone')
    .controller('FollowedCtrl', FollowedCtrl);

 function FollowedCtrl (
                        $scope,
                        $reactive,
                        $rootScope,
                        $state,
                        $ionicLoading,
                        $ionicHistory,
                        $timeout,
                        $ionicScrollDelegate,
                        $ionicModal,
                        $window
                      ){

   $reactive(this).attach($scope);
   var self = this;
   this.isSeller = $state.is('app.sell');
   this.contentLoaded = false;
   self.noPosts = "";
   this.listingIds = [];
   this.language = window.localStorage.getItem('language') || 'en';
  //Variable for pagination.
   self.paginate = false;
   
   this.helpers({
     userId: () => Meteor.userId()
   });

   this.allConditions = ['DATA.PRODUCT', 'DATA.SERVICE', 'DATA.B2B'];

   var savedOptions = JSON.parse( $window.localStorage.getItem('search') );

  //Variables for infinite scroll.
  this.options = {
    loaded: 10,
    skip: 0,
    distance: savedOptions && savedOptions.distance && savedOptions.distance <= searchCardDistance(this.userId)
      ? savedOptions.distance : searchCardDistance(this.userId),
    coordinates: savedOptions ? savedOptions.coordinates : myCoordinates(),
    sort: savedOptions ? savedOptions.sort : 'date',
    minPrice: savedOptions ? savedOptions.minPrice : null,
    maxPrice: savedOptions ? savedOptions.maxPrice : null,
    condition: savedOptions ? savedOptions.condition : self.allConditions,
    search: '',
    sameCurrency: false
  };

  this.condition = [{
    selected: savedOptions && savedOptions.condition.indexOf('DATA.PRODUCT') === -1 ? false : true,
    value: 'DATA.PRODUCT'
  },{
    selected: savedOptions && savedOptions.condition.indexOf('DATA.SERVICE') === -1 ? false : true,
    value: 'DATA.SERVICE'
  },{
    selected: savedOptions && savedOptions.condition.indexOf('DATA.B2B') === -1 ? false : true,
    value: 'DATA.B2B'
  }];

  this.distance = this.options.distance;
  this.minPrice = this.options.minPrice;
  this.maxPrice = this.options.maxPrice;
  this.sameCurrency = this.options.sameCurrency;
  this.sort = this.options.sort;

  this.searched = this.options.search;

  this.limit = self.options.loaded;

  //IDs of all listings with user's offer.
  self.postIDs = [];

  //Set listing data options.
  self.selector =[{
    _id: {
      $in: self.listingIds
    },
    condition: {
      $in: self.options.condition
    },
    isPublished: true,
    hasLocation: true,
    active: true,
    $or:[{
      expiryDate: {
        $gt: new Date()
      }
    },{
      expiryDate: null
    }]
  },
  {
    limit: self.options.loaded,
    sort: { postDate: -1 }
  }];

  if ( self.options.coordinates ) {
    this.selector[0] = _.extend(self.selector[0],{
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [ self.options.coordinates[0], self.options.coordinates[1] ]
          },
          $maxDistance: self.options.distance * 1000
        }
      }
    });
  }

  this.getListings = function(){

    this.subscribe('listingIndex', () => [ 'follow', undefined, self.options ], {
      onReady: function() {

        let follows = Follows.find({ userId: Meteor.userId() }).fetch();

        self.listingIds = follows.map( followed => { return followed.listingId; });

        self.selector[1] = _.extend(self.selector[1], {
          limit: self.options.loaded,
          skip: self.options.skip
        });

        //Method is located at tapshop/lib/methods/app_methods.js
        self.call('allPosts', 'follow', undefined, self.options, function(err, count) {
          self.allposts = count;

          self.selector[0]._id = {
            $in: self.listingIds
          }

          let listings = Listings.find(self.selector[0], self.selector[1]).fetch();

          if( self.options.sort === 'priceMin' || self.options.sort === 'priceMax' ){

            listings.map( data => {

              let newPrice = convertCurrency(data.sellPrice, data.currency, self.baseCurrency);

              data.sellPrice = parseFloat( newPrice )

              data.currency = self.baseCurrency

              return data;
            });

            listings = self.options.sort === 'priceMin' ? _.sortBy(listings, 'sellPrice') : _.sortBy(listings, 'sellPrice').reverse();
          }

          self.listings = listings;

          self.contentLoaded = true;

          if (!self.options.coordinates) {

            self.noPosts = 'LABEL.NO_GPS';

          } else if (self.listings.length > 0){

            self.noPosts = "LABEL.NO_RESULTS";
          
          } else {

            self.noPosts = "LABEL.NO_FOLLOWED_LISTINGS";
          
          }

          if (
            (self.options.loaded >= 50 && ( self.options.skip + self.options.loaded ) < self.allposts) ||
            (self.options.skip !== 0 && ( self.options.skip + self.options.loaded ) >= self.allposts)
          ){
            self.paginate = true;
          }

          $ionicLoading.hide();
          return;
        });
      },
      onStop: function(err){
        if(err){
          console.log(err);
          self.contentLoaded = true;
          $ionicLoading.hide();

          if (!self.options.coordinates) {
            self.noPosts = 'LABEL.NO_GPS';
            return;
          }

          self.noPosts = "LABEL.NO_INTERNET";
        }
        return;
      }
    });
  }

  this.getListings();

  //Get image of this listing.
  this.upload = function(id) {
    let upload = Uploads.findOne({ 'meta.listID': id });
    if ( upload ) {
      return upload.link();
    } else {
      return;
    }
  };

  //Get offers of this listing.
  this.offer = function(id) {
    let offer = Offers.findOne({
          listingID: id
        },{
          sort: {
            offerAmount: -1,
            offerDate: 1
          }
        });

    if ( offer ) {
      return offer.offerAmount.toFixed(0);
    }
    else {
      return false;
    }
  };

  this.currency = function(price){
    return price.toFixed(0);
  }

  //Check if user and listing has geolocation coordinates.
  this.hasCoords = function(hasLocation){
    if( Session.get('myCoordinates') && hasLocation === true ){
      return true;
    }
    else {
      return false;
    }
  };

  this.showOptions = function(){
    $scope.modal.show();
  }

  this.hideOptions = function(){

    self.condition.map( condition => {
      if( self.options.condition.indexOf(condition.value) === -1 ){
        condition.selected = false;
      }
      else{
        condition.selected = true;
      }
    });

    this.distance = this.options.distance;
    this.minPrice = this.options.minPrice;
    this.maxPrice = this.options.maxPrice;
    this.sameCurrency = this.options.sameCurrency;
    this.sort = this.options.sort;
    $scope.modal.hide();
  }

  this.applyOptions = function(){
    $scope.modal.hide();
    self.paginate = false;
    self.noPosts = "";
    self.listings = [];
    $ionicScrollDelegate.scrollTop();
    $window.localStorage.setItem('search', JSON.stringify(self.options) );
    return self.getListings();
  }

  this.setSort = function(){
    /*
    if(self.options.sort !== 'distance' && self.selector[0].location ){
      delete self.selector[0].location;
    }
    */

    if( self.options.sort === 'distance' ){

      if( self.options.distance === null ){
        self.selector[0] = _.extend(self.selector[0],{
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [ self.options.coordinates[0], self.options.coordinates[1] ]
              },
              $minDistance: 0
            }
          }
        });
      }

      if( self.options.search ){
        self.selector[1].sort = { score: { $meta: "textScore" } };
      }
      else if( !self.options.search &&  self.selector[1].sort ){

        delete self.selector[1].sort;

      }

    }
    else if( self.options.sort === 'date' ){

      self.selector[1].sort = self.options.search ? { score: { $meta: "textScore" }, postDate: -1 } : { postDate: -1 };

    }
    else if( self.options.sort === 'priceMin' ){

      self.selector[1].sort = self.options.search ? { score: { $meta: "textScore" }, sellPrice: 1 } : { sellPrice: 1 };

    }
    else if( self.options.sort === 'priceMax'){

      self.selector[1].sort = self.options.search ? { score: { $meta: "textScore" }, sellPrice: -1 } : { sellPrice: -1 };

    }

    return self.applyOptions();
  }

  this.setFilters = function(){

    if( self.options.distance ){
      self.selector[0] = _.extend(self.selector[0],{
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [ self.options.coordinates[0], self.options.coordinates[1] ]
            },
            $maxDistance: self.options.distance * 1000
          }
        }
      });
    }

    self.options.condition = self.condition
      .filter( condition => { return condition.selected === true })
      .map( condition => { return condition.value });

    if( self.options.condition.length === 0 ){
      self.options.condition = self.allConditions;
      self.condition.map( condition => { condition.selected = true; });
    }

    self.selector[0].condition = {
      $in: self.options.condition
    }

    if( self.options.minPrice && self.options.maxPrice ){

      self.selector[0].sellPrice = {
        $gte: self.options.minPrice,
        $lte: self.options.maxPrice
      }

    } else if( self.options.minPrice && !self.options.maxPrice ){

      self.selector[0].sellPrice = {
        $gte: self.options.minPrice
      }

    }
    else if( !self.options.minPrice && self.options.maxPrice  ){

      self.selector[0].sellPrice = {
        $lte: self.options.maxPrice
      }

    }
    else if( !self.options.minPrice && !self.options.maxPrice && self.selector[0].sellPrice ){
      delete self.selector[0].sellPrice;
    }

    return self.setSort();
  }

  this.setOptions = function(){

        if( !myCoordinates() ){

          $translate('MESSAGE.TOAST.ENABLE_GPS').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });

          return;
        }

        if( !self.distance || self.distance === 0 || isNaN(self.distance) ){
          self.distance = searchCardDistance(this.userId);
        }

        if( !self.minPrice || self.minPrice === 0 || isNaN(self.minPrice) ){
          self.minPrice = null
        }

        if( !self.maxPrice || self.maxPrice === 0 || isNaN(self.maxPrice) ){
          self.maxPrice = null
        }

        if (self.distance && self.distance > searchCardDistance(this.userId) ) {

          $translate('MESSAGE.TOAST.MAX_DISTANCE_ERROR').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });

          return;
        }

        if( self.minPrice && self.maxPrice && parseFloat(self.minPrice) > parseFloat(self.maxPrice) ){

          $translate('MESSAGE.TOAST.MIN_PRICE_INVALID').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });

          return;
        }

        $rootScope.$broadcast('loadspinner');

        self.minPrice = self.minPrice ? parseFloat(self.minPrice).toFixed(2) : null;

        self.maxPrice = self.maxPrice ? parseFloat(self.maxPrice).toFixed(2) : null;

        self.options = _.extend(self.options, {
          loaded: 10,
          skip: 0,
          distance: self.distance ? parseFloat(self.distance) : searchCardDistance(this.userId),
          coordinates: myCoordinates(),
          sort: self.sort,
          minPrice: self.minPrice ? parseFloat( self.minPrice ) : null,
          maxPrice: self.maxPrice ? parseFloat( self.maxPrice ) : null,
          condition: self.condition,
          sameCurrency: self.sameCurrency
        });

        return self.setFilters();
  }

  this.search = function() {
    if( self.options.search === self.searched ){
      return;
    }

    setTimeout(function(){
      self.searched = self.options.search;

      if( self.options.search ){
        self.selector[0].title = buildRegExp(self.options.search);
      }
      else if( !self.options.search && self.selector[0].title ){
        delete self.selector[0].title;
      }

      return self.setSort();

    }, 600);

  }

  //Go to Product Page of listing.
  this.go = function(id) {
    $state.go('app.product', { listingId: id });
  };

  //Infinite scroll function.
  $scope.loadMore = function() {
    $timeout( function(){
      if ( (self.options.loaded + 5) > 50 ) {
        self.options.loaded = 50;
      } else {
        self.options.loaded += 5;
      }
      $scope.$broadcast('scroll.infiniteScrollComplete');
      return self.getListings();
    }, 1000);
  };

  //Refresher function.
  $scope.refresh = function() {
    self.listings = [];
    self.options.skip = 0;
    self.options.loaded = 10;
    $state.reload();
    $scope.$broadcast('scroll.refreshComplete');
    return self.getListings();
  };

  //Pagination Back Button.
  this.back = function() {
    $rootScope.$broadcast('loadspinner');
    self.listings = [];
    self.options.loaded = 10;
    if ( self.options.skip !== 0 ) {
      self.options.skip -= 50;
    }
    self.paginate = false;
    $ionicScrollDelegate.scrollTop();
    return self.getListings();
  };

  //Pagination Forward Button.
  this.next = function() {
    $rootScope.$broadcast('loadspinner');
    self.listings = [];
    self.options.loaded = 10;
    self.options.skip += 50;
    self.paginate = false;
    $ionicScrollDelegate.scrollTop();
    return self.getListings();
  };

  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = false;
    $ionicHistory.clearHistory();
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }

    //Modal to show users with offers.
    $ionicModal.fromTemplateUrl('client/templates/shop/components/search_options.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    //Show Ad on this Page.
    /*
    if (Meteor.isCordova && AdMob) {
      AdMob.showBanner(AdMob.AD_POSITION.BOTTOM_CENTER);
    } else {
      return;
    }
    */
  });

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    $scope.modal.remove();

    //Hide Ad on on leave.
    /*
    if (Meteor.isCordova && AdMob) {
      AdMob.hideBanner();
    } else {
      return;
    }
    */
  });
};
