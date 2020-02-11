import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import buildRegExp from '../../../lib/components/searchRegex';
import { myCoordinates } from '../../components/my-coordinates';

angular
    .module('salephone')
    .controller('StoresCtrl', StoresCtrl);

function StoresCtrl (
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
  this.noPosts = "";
  this.searchText = '';
  this.searched = this.searchText;
  
  if( window.localStorage.getItem('language') ){
    this.language = window.localStorage.getItem('language');
  }
  else{
    this.language = 'en';
  }
  

  if( window.localStorage.getItem('stores') ){
    this.products = JSON.parse( window.localStorage.getItem('stores') );
  }

  //Variables for infinite scroll.
  self.loaded = 10;
  self.limit = self.loaded;

  $ionicPopover.fromTemplateUrl('client/templates/nav-links/stores.html', {
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
    this.subscribe('storesMain', () => [ self.searchText, myCoordinates(), self.loaded ], {
      onReady: function() {
        //Get count of all Products in server.
        //Method is located at tapshop/lib/methods/app_methods.js
        self.call('allStores', self.searchText, myCoordinates(), function(err, data) {
          
          self.allproducts = data.count;
          self.limit = self.loaded;
          
          let selector = {
            active: true,
            listingsCount: { $gt: 0 }
          }

          let options = {
            sort: {
                lastPost: -1,
                name: 1
            },
            limit: self.limit
          }

          if(self.searchText){
            
            if( data.listingIds.length > 0){

              selector = {
                $or:[{ 
                  name: buildRegExp(self.searchText)
                },{ 
                  _id: {
                    $in: data.listingIds
                  } 
                }],
                listingsCount: { 
                  $gt: 0 
                },
                active: true
              }

            }
            else { 

              selector.name = buildRegExp(self.searchText);

            }
            
            options.sort = {
              score: { $meta: "textScore" },
              lastPost: -1,
              name: 1
            }

          }
        
          self.products = Stores.find(selector, options).fetch();

          window.localStorage.setItem('stores', JSON.stringify(self.products) );
          
          self.contentLoaded = true;

          if(self.searchText){
            self.noPosts = 'LABEL.NO_STORE_RESULTS';
          }
          else{
            self.noPosts = 'LABEL.NO_POSTS';
          }
            

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

  self.call('updateStoresCounts', function(){
    self.getData();
  });
  
  this.isLiked = function( storeId ){
    if( !Meteor.userId() ){
      return false;
    }

    let favorite = Favorites.findOne({
      userId: Meteor.userId(),
      storeId: storeId
    });
    
    return favorite ? true : false;
  }

  this.likeStore = function(storeId){
    
    if( !Meteor.userId() ){
      $state.go('app.login');
      return;
    }

    self.call('favoriteStore', storeId, function(err){
      if(err){
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });
        return;
      }
    });
  }

  //Go to Search Page on tap of search text box.
  this.search = function() {

    if( self.searchText === self.searched ){
      return;
    }

    setTimeout(function(){
      
      self.searched = self.searchText;
      self.noPosts = '';
      self.products = [];
      self.loaded = 10;
      $scope.$broadcast('scroll.refreshComplete');
      return self.getData();

    }, 600);
  }

  //Go to Shop tab.
  this.selectCat = function() {
    $ionicViewSwitcher.nextDirection("enter");
    $state.go('app.shop');
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
