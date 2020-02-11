import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

angular
    .module('salephone')
    .controller('ShopCtrl', ShopCtrl);

function ShopCtrl (
                    $scope,
                    $state,
                    $reactive,
                    $rootScope,
                    $ionicLoading,
                    $ionicHistory,
                    $ionicViewSwitcher,
                    $stateParams,
                    $timeout,
                    $translate,
                    $cordovaToast,
                    $ionicPopover
                  ){
  $reactive(this).attach($scope);
  var self = this;
  this.products = [];
  this.contentLoaded = false;
  self.noPosts = "";
  
  this.language = window.localStorage.getItem('language') || 'en';
  

  if( window.localStorage.getItem('products') ){
    this.products = JSON.parse( window.localStorage.getItem('products') );
  }

  //Variables for infinite scroll.
  self.loaded = 10;
  self.limit = self.loaded;

  $ionicPopover.fromTemplateUrl('client/templates/nav-links/home.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.links = popover;
  });


  this.getData = function(){

    /*
    if( Meteor.status().connected === false ){
      self.contentLoaded = true;
      self.noPosts = "LABEL.NO_INTERNET";
    }
    */    

    //Load products on scroll.
    this.subscribe('shopMain', () => [ self.loaded ], {
      onReady: function() {
        //Get count of all Products in server.
        //Method is located at tapshop/lib/methods/app_methods.js
        self.call('allProducts', function(err, count) {
          self.allproducts = count;
          self.limit = self.loaded;
        
          self.products = Products.find({
            listingsCount: { $gt: 0 }
          },{
            sort: {
              productOffersCount: -1,
              listingsCount: -1,
              name: 1
            },
            limit: self.limit
          }).fetch();

          window.localStorage.setItem('products', JSON.stringify(self.products) );
          
          self.contentLoaded = true;
          self.noPosts = 'LABEL.NO_POSTS';

          $ionicLoading.hide();
          return;        
        });
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
  };

  self.call('updateProductCounts', function(){
    self.getData();
  });
  
  //Go to Search Page on tap of search text box.
  this.search = function() {
    $ionicViewSwitcher.nextDirection("enter");
    $state.go('app.search');
  }

  //Go to Shop tab.
  this.selectStores = function() {
    $ionicViewSwitcher.nextDirection("enter");
    $state.go('app.stores');
  };
  
  //Infinite scroll function.
  $scope.loadMore = function() {
    $timeout( function(){
      self.loaded += 5;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      return self.getData();
    }, 2000);
  };

  //Refresher function.
  $scope.refresh = function() {
    self.noPosts = '';
    self.products = [];
    self.loaded = 10;
    $scope.$broadcast('scroll.refreshComplete');
    return self.getData();
  };

  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    if ( !document.getElementById("content-main") ) {
      $rootScope.$broadcast('loadspinner');
    }
    viewData.enableBack = false;
    $ionicHistory.clearHistory();
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

  $scope.$on('$ionicView.leave', function (event, viewData) {
  //Hide Ad on on leave.
    /*
    if (Meteor.isCordova && AdMob) {
      AdMob.hideBanner();
    } else {
      return;
    }
    */
  });

  if ( $state.is('app.verify') === true && $stateParams.token ) {
    $rootScope.$broadcast('loadspinner');
    //Get token for email verification.
    Accounts.verifyEmail($stateParams.token, function(err){
      if(!err) {
        
        $translate('MESSAGE.TOAST.ACCOUNT_VERIFIED').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showShortBottom(message);
          } 
          else {
            toastr.success(message);
          }
        });

        $ionicLoading.hide();
      } 
      else {
          
        $translate('MESSAGE.TOAST.CANNOT_VERIFY').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          } 
          else {
            toastr.error(message);
          }
        });

        $ionicLoading.hide();
      }
    });
  }
};
