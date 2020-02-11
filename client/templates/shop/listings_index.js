import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import buildRegExp from '../../../lib/components/searchRegex';
import { myCoordinates } from '../../components/my-coordinates';
import { searchCardDistance } from '../../../lib/components/search-card-distance';

angular
    .module('salephone')
    .controller('ListingsCtrl', ListingsCtrl);

function ListingsCtrl(
                      $scope,
                      $stateParams,
                      $state,
                      $reactive,
                      $rootScope,
                      $ionicLoading,
                      $timeout,
                      $ionicScrollDelegate,
                      //$ionicPopover,
                      $ionicPopup,
                      $translate,
                      $ionicModal,
                      $window,
                      convertCurrency
                    ){
  $reactive(this).attach($scope);
  var self = this;
  this.listings = [];
  this.contentLoaded = false;
  this.noPosts = "";
  this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';

  this.helpers({
    myprofile: () => Profile.findOne({ profID: Meteor.userId() }),
    userId: () => Meteor.userId()
  });

  //Variable for pagination.
  this.paginate = false;

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
  }
];

  this.distance = this.options.distance;
  this.minPrice = this.options.minPrice;
  this.maxPrice = this.options.maxPrice;
  this.sort = this.options.sort;
  this.sameCurrency = this.options.sameCurrency;

  this.searched = this.options.search;

  //Set listing data options.
  self.selector =[{
    active: true,
    isPublished: true,
    hasLocation: true,
    condition: {
      $in: self.options.condition
    },
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

  if( $stateParams.type === 'category' ){
    self.selector[0].productID = $stateParams.groupId;
  }
  else if( $stateParams.type === 'store' ){
    self.selector[0].storeId = $stateParams.groupId;
  }

  this.getListings = function(){

      //Load listings on scroll.
      this.subscribe('listingIndex', () => [ $stateParams.type, $stateParams.groupId, self.options ], {
        onReady: function() {

          self.selector[1] = _.extend(self.selector[1], {
            limit: self.options.loaded,
            skip: self.options.skip
          });

          //Get count of all listings in server.
          //Method is located at tapshop/lib/methods/app_methods.js
          self.call('allPosts', $stateParams.type, $stateParams.groupId, self.options, function(err, count) {
            self.allposts = count;

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

            } else if (self.options.search){

              self.noPosts = 'LABEL.NO_RESULTS';

            }
            else {
              self.noPosts = 'LABEL.NO_POSTS';
            }

            if (
              (self.options.loaded >= 20 && ( self.options.skip + self.options.loaded ) < self.allposts) ||
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
  this.offerAmount = function(id, currency) {
    let offer = Offers.findOne({
          listingID: id
        },{
          sort: {
            offerAmount: -1,
            offerDate: 1
          }
        });

    if ( !offer ) {
      return;
    }

    return convertCurrency(offer.offerAmount, offer.currency, this.baseCurrency);
  };

  this.priceAmount = function(price, currency){
    if(!price || !currency){
      return;
    }

    return convertCurrency(price, currency, this.baseCurrency);
  }

  //Go to Product Page of listing.
  this.go = function(listingId) {
    if ( Listings.findOne({ _id: listingId }).listedBy != Meteor.userId() ) {
      $state.go('app.product', { listingId: listingId });
    }
    else {
      $state.go('app.myproduct', { listingId: listingId });
    }
  };

  //Infinite scroll function.
  $scope.loadMore = function() {
    $timeout( function(){
      if ( (self.options.loaded + 5) > 20 ) {
        self.options.loaded = 20;
      } else {
        self.options.loaded += 5;
      }
      $scope.$broadcast('scroll.infiniteScrollComplete');
      self.getListings();
      return;
    }, 1000);
  };

  //Refresher function.
  $scope.refresh = function() {
    self.paginate = false;
    self.noPosts = "";
    self.listings = [];
    self.options.skip = 0;
    self.options.loaded = 10;
    $scope.$broadcast('scroll.refreshComplete');
    return self.getListings();
  };

  //Pagination Back Button.
  this.back = function() {
    self.paginate = false;
    self.noPosts = "";
    self.listings = [];
    $ionicScrollDelegate.scrollTop();
    $rootScope.$broadcast('loadspinner');
    self.options.loaded = 10;
    if ( self.options.skip >= 20 ) {
      self.options.skip -= 20;
    }
    else{
      self.options.skip = 0;
    }

    return self.getListings();
  };

  //Pagination Forward Button.
  this.next = function() {
    self.paginate = false;
    self.noPosts = "";
    self.listings = [];
    $ionicScrollDelegate.scrollTop();
    $rootScope.$broadcast('loadspinner');
    self.options.loaded = 10;
    self.options.skip += 20;

    return self.getListings();
  };

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
    $window.localStorage.setItem('search', JSON.stringify(self.options) );
    $ionicScrollDelegate.scrollTop();
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
          self.minPrice = null;
        }

        if( !self.maxPrice || self.maxPrice === 0 || isNaN(self.maxPrice) ){
          self.maxPrice = null;
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


  //Set by max distance.
  /*
  this.setDistance = function(){
    if( Session.get('myCoordinates') ){

      $translate([
        'LABEL.MAX_DISTANCE',
        'LABEL.CANCEL',
        'LABEL.SET',
        'LAYOUT.STYLE'
      ]).then(function (result) {

        self.myPopup = $ionicPopup.show({
          template: '<input type="tel" ng-model="vm.max" autofocus>',
          cssClass: result['LAYOUT.STYLE'],
          title: result['LABEL.MAX_DISTANCE'],
          scope: $scope,
          buttons: [{
            text: result['LABEL.CANCEL'],
            onTap: function(e) {
              self.max = self.options.distance;
            }
          },{
            text: '<b>' + result['LABEL.SET'] + '</b>',
            type: 'button-positive',
            onTap: function(e) {

              if( parseInt(self.max) !== self.options.distance ){
                $rootScope.$broadcast('loadspinner');
              }

              if ( self.max && isNaN( self.max ) === false ) {
                self.listings = [];

                let coords = Session.get('myCoordinates');

                self.options = _.extend(self.options,{
                  loaded: 10,
                  skip: 0,
                  distance: parseInt(self.max),
                  coordinates: [ coords.lng, coords.lat ]
                });

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

                self.paginate = false;
                $ionicScrollDelegate.scrollTop();

                return self.getListings();
              }
              else {
                self.listings = [];

                self.options = _.extend(self.options,{
                  loaded: 10,
                  skip: 0,
                  distance: null,
                  coordinates: null
                });

                if( self.options.sort !== 'distance'){
                  self.selector[0] = {
                    active: true,
                    $or:[{
                      expiryDate: {
                        $gt: new Date()
                      }
                    },{
                      expiryDate: null
                    }]
                  }

                  if( $stateParams.type === 'category' ){
                    self.selector[0].productID = $stateParams.groupId;
                  }
                  else if( $stateParams.type === 'store' ){
                    self.selector[0].storeId = $stateParams.groupId;
                  }
                }

                self.paginate = false;
                $ionicScrollDelegate.scrollTop();

                return self.getListings();
              }
            }
          }]
        });

      });
    }
    else {
      $translate('MESSAGE.TOAST.ENABLE_GPS').then(function (message) {
        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }
        else {
          toastr.error(message);
        }
      });
    }
  }

  //Show sort options.
  this.sortOptions = function($event){
    $scope.popover.show($event);
  }

  //Set sort option.
  this.getSort = function(option){
    $scope.popover.hide();
    if( option !== self.options.sort ){
      $rootScope.$broadcast('loadspinner');
      self.listings = [];

      if( option === 'distance' ){
        if ( Session.get('myCoordinates') ){

          let coords = Session.get('myCoordinates');

          self.options = _.extend(self.options,{
            loaded: 10,
            skip: 0,
            sort: 'distance',
            coordinates: [ coords.lng, coords.lat ]
          });

          self.paginate = false;
          $ionicScrollDelegate.scrollTop();

          self.selector[1] = {
            limit: self.options.loaded
          }

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
        }
        else {

          $translate('MESSAGE.TOAST.ENABLE_GPS').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });

          $ionicLoading.hide();
          self.sort = self.options.sort || 'date';
        }
      }
      else if ( option === 'date' ){
        self.options = _.extend(self.options,{
          loaded: 10,
          skip: 0,
          sort: 'date'
        });

        if( self.options.distance === null ){

          self.selector[0] = {
            active: true,
            $or:[{
              expiryDate: {
                $gt: new Date()
              }
            },{
              expiryDate: null
            }]
          }

          if( $stateParams.type === 'category' ){
            self.selector[0].productID = $stateParams.groupId;
          }
          else if( $stateParams.type === 'store' ){
            self.selector[0].storeId = $stateParams.groupId;
          }
        }

        self.selector[1] = _.extend(self.selector[1],{
          sort: { postDate: -1 }
        });

        self.paginate = false;
        $ionicScrollDelegate.scrollTop();
      }
      else if ( option === 'price' ){
        self.options = _.extend(self.options,{
          loaded: 10,
          skip: 0,
          sort: 'price'
        });

        if( self.options.distance === null ){
          self.selector[0] = {
            active: true
          }

          if( $stateParams.type === 'category' ){
            self.selector[0].productID = $stateParams.groupId;
          }
          else if( $stateParams.type === 'store' ){
            self.selector[0].storeId = $stateParams.groupId;
          }
        }

        self.selector[1] = _.extend(self.selector[1],{
          sort: { sellPrice: 1 }
        });

        self.paginate = false;
        $ionicScrollDelegate.scrollTop();
      }

      return self.getListings();
    }
    else {
      return;
    }
  }
  */

  this.isSeller = $state.is('app.sell');
  this.isOffer = $state.is('app.myoffers');

  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    if ( !document.getElementById("content-main") ) {
      $rootScope.$broadcast('loadspinner');
    }
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

    /*
    $ionicPopover.fromTemplateUrl('client/templates/shop/components/sort.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.popover = popover;
    });
    */

    /*
    //Show Ad on this Page.
    if (Meteor.isCordova && AdMob) {
      AdMob.showBanner(AdMob.AD_POSITION.BOTTOM_CENTER);
    } else {
      return;
    }
    */
  });

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    //$scope.popover.remove();
    if(self.myPopup){
      self.myPopup.close();
    }
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
