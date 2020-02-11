import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

angular
    .module('salephone')
    .controller('OffersRcvdCtrl', OffersRcvdCtrl);

 function OffersRcvdCtrl (
    $scope,
    $reactive,
    $rootScope,
    $state,
    $ionicLoading,
    $ionicHistory,
    $timeout,
    $ionicScrollDelegate,
    $window,
    convertCurrency
  ){

   $reactive(this).attach($scope);
   var self = this;
   this.contentLoaded = false;
   self.noPosts = "";
   this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';

  //Variable for pagination.
   self.paginate = false;

  //Variables for infinite scroll.
   self.options = {
     loaded: 10,
     skip: 0
   };
   
   self.limit = self.options.loaded;

   //Method is located at tapshop/lib/methods/app_methods.js
   Meteor.call('allOffersReceived', function(err, count) {
     self.allposts = count;
   });

  //Load listings on scroll.
   this.subscribe('offersRecieved', () => [ self.getReactively('options', true) ], {
     onReady: function() {

       self.limit = self.options.loaded;

       if (
         (self.options.loaded >= 50 && ( self.options.skip + self.options.loaded ) < self.allposts) ||
         (self.options.skip !== 0 && ( self.options.skip + self.options.loaded ) >= self.allposts)
       ){
         self.paginate = true;
       }

       self.contentLoaded = true;
       
       self.noPosts = "LABEL.NO_MY_OFFERS";

       $ionicLoading.hide();
       return;
     },
     onStop: function(err){
          if(err){
            console.log(err);
            self.contentLoaded = true;
            self.noPosts = "LABEL.NO_INTERNET";
            $ionicLoading.hide();
          }
          return;
     }
   });
     
  this.helpers({
    offers: () =>  Offers.find({
      seller: Meteor.userId()
    },{
      sort: { offerDate: -1 }
    })
  });

  this.profileImage = function(userId) {

    const image = ProfileImg.findOne({ 'meta.userId': userId });
      
    const profile = Profile.findOne({ profID: userId });

    if(!profile) {
      return;
    }

    if(!image) {
      return profile.profImage;
    }

    return image.link();
  }
  


  this.goodRating = function(userId) {
    const profile = Profile.findOne({ profID: userId });

    if(!profile) {
      return 0
    }

    return profile.goodRating;
  }

  this.badRating = function(userId) {
    const profile = Profile.findOne({ profID: userId });
    
    if(!profile) {
      return 0
    }

    return profile.badRating;
  }

  this.listingTitle = function(listingId) {
    const listing = Listings.findOne({ _id: listingId });

    if(!listing) {
      return;
    }

    return listing.title;
  }

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
    const listing = Listings.findOne({ _id: listingId });

    if(!listing) {
      return;
    }

    $state.go('app.myproduct', { listingId, viewoffer: 1 });
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
    }, 2000);
  };

  //Refresher function.
  $scope.refresh = function() {
    self.options.skip = 0;
    self.options.loaded = 10;
    $state.reload();
    $scope.$broadcast('scroll.refreshComplete');
  };

  //Pagination Back Button.
  this.back = function() {
    $rootScope.$broadcast('loadspinner');
    self.options.loaded = 10;
    if ( self.options.skip !== 0 ) {
      self.options.skip -= 50;
    }
    self.paginate = false;
    $ionicScrollDelegate.scrollTop();
  };

  //Pagination Forward Button.
  this.next = function() {
    $rootScope.$broadcast('loadspinner');
    self.options.loaded = 10;
    self.options.skip += 50;
    self.paginate = false;
    $ionicScrollDelegate.scrollTop();
  };

  this.noPosts = "You have no pending offers.";

  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    if ( !document.getElementById("content-main") ) {
      $rootScope.$broadcast('loadspinner');
    }
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
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
