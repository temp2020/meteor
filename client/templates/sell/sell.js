import { Meteor } from 'meteor/meteor';
import { newListing } from './components/new_listing_data';

angular
    .module('salephone')
    .controller('SellCtrl', SellCtrl);

 function SellCtrl (
                    $state,
                    $scope,
                    $reactive,
                    $rootScope,
                    $ionicLoading,
                    $ionicHistory,
                    $timeout,
                    $ionicScrollDelegate,
                    $translate,
                    $cordovaToast,
                    $window,
                    convertCurrency,
                    $ionicPopover,
                    newListing
                  ){
    $reactive(this).attach($scope);
    var self = this;
    this.contentLoaded = false;
    self.noPosts = "LABEL.LOGIN_TO_VIEW";
    this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';
    this.language = window.localStorage.getItem('language') || 'en';
    //Variable for pagination.
    self.paginate = false;
    this.newFile;
    //Variable for profile;
    self.showProfile = false;

    //Variables for infinite scroll.
    self.options = {
      loaded: 10,
      skip: 0
    };
    self.limit = self.options.loaded;

    $ionicPopover.fromTemplateUrl('client/templates/nav-links/my_products.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.links = popover;
    });

    $scope.hidePopover = function($event) {
      $scope.links.hide();
      $scope.showProfile = !$scope.showProfile;
   };

    //Get count of all posts in server.
    //Method is located at tapshop/lib/methods/app_methods.js
    Meteor.call('myAllPosts', function(err, count) {
      self.allposts = count;
    });

    //Load listings on scroll.
    this.subscribe('myPosts', () => [ self.getReactively('options', true) ], {
      onReady: function() {
        self.limit = self.options.loaded;      
        if (
          (self.options.loaded >= 50 && ( self.options.skip + self.options.loaded ) < self.allposts) ||
          (self.options.skip !== 0 && ( self.options.skip + self.options.loaded ) >= self.allposts)
        ){
          self.paginate = true;
        }

        self.contentLoaded = true;
    
        if ( Meteor.userId() ) {
          self.noPosts = "LABEL.NO_SALE"
        } 
        else {
          self.noPosts = "LABEL.LOGIN_TO_VIEW"
        }

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
      noPosts: () => this.getReactively('noItems'),
      listings: () => Listings.find({
        listedBy: Meteor.userId(),
        active: true
      },{
        limit: self.getReactively('limit'),
        sort: { postDate: -1 }
      }),
      store: () => Stores.findOne({ userId: Meteor.userId() })
    });

    this.onFileSelect = function(files) {
      if (files[0]) {

        newListing.init();

        const image = window.URL.createObjectURL(files[0]);

        newListing.newForm(image);
        
        $state.go('app.new-post-images');
      }
    }

    this.addFile = function() {
      newListing.addImageFile()
        .then(function(image) {

          if(!image) {
            return;
          }
          
          image = "data:image/jpeg;base64," + image;
          
          newListing.init();

          newListing.newForm(image);

          $state.go('app.new-post-images');
        },
        function(err){
          $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
            $cordovaToast.showLongBottom(message);
          });
        });
    }

    this.newImage = function() {

      if( Meteor.isCordova ) {
        self.addFile();
        return;
      }

      const fileInput = document.getElementById('new-upload');

      fileInput.click();
    }

    this.new = function(){
      if( !Meteor.userId() ){
        $state.go('app.login');
        return;
      }

      self.call('checkListingCount', function(err, res){
        if( res === true ){

          self.newImage();

          return;

        } else {
          if( res === false ){

            $translate('MESSAGE.TOAST.LISTING_LIMIT').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }
              else {
                toastr.error(message);
              }
            });
            return;
          }
          else{

            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }
              else {
                toastr.error(message);
              }
            });

          }
        }
      });
    }

    //Get image of this listing.
    this.upload = function(id) {
      let upload = Uploads.findOne({ 'meta.listID': id });
      if ( upload ) {
        return upload.link();
      } else {
        return;
      }
    };

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
    this.go = function(id) {
      $state.go('app.myproduct', { listingId: id });
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
      $state.reload('app.sell');
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

    this.isSeller = $state.is('app.sell');

    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
      if ( !document.getElementById("content-main") ) {
        $rootScope.$broadcast('loadspinner');
      }
      viewData.enableBack = false;
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
