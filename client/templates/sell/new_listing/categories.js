import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('NewPostCategoriesCtrl', NewPostCategoriesCtrl);

function NewPostCategoriesCtrl (
  $scope,
  $state,
  $reactive,
  $ionicLoading,
  $ionicPlatform,
  $ionicHistory,
  $ionicViewSwitcher,
  $timeout,
  $translate,
  newListing
){

  $reactive(this).attach($scope);
  var self = this;
  this.language = $translate.use() ||'en';

  //Varianles for infinite scroll.
  self.limit = 20;
  self.loaded = self.limit;

  if( window.localStorage.getItem('productSelection') ){
    this.products = JSON.parse( window.localStorage.getItem('productSelection') );
  }

  //Method is located at tapshop/lib/methods/app_methods.js
  Meteor.call('productSelect', function(err, count){
    if (!err){
      self.allproducts = count;
    }
  })

  this.getData = function(){
    this.subscribe('selectModel', () => [ self.limit ], {
      onReady: function() {
        self.loaded = self.limit;

        const options = {
          sort: {},
          limit: self.getReactively('loaded')
        };

        const key = `name.${self.language}`;

        options.sort[key] = 1;

        self.products = Products.find({}, options).fetch();

        $ionicLoading.hide();
        return;
      }
    })
  }

  this.getData();

  this.next = function(productId) {
    
    if( !self.products.find(product => product._id === productId) && productId !== null ) {
      
      $translate('MESSAGE.TOAST.INVALID_CATEGORY').then(function (message) {

        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }
        else {
          toastr.error(message);
        }

      });

      return;
    }

    newListing.addField('productID', productId);

    $state.go('app.new-post-title');
  }

  //Infinite scroll function.
  $scope.loadMore = function() {
      $timeout( function(){
        self.limit += 10;
        this.getData();
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 2000);
  };

  $ionicPlatform.onHardwareBackButton( function(){
    if ( $ionicHistory.backView() === null ) {
      $ionicViewSwitcher.nextDirection("back");
      $state.go('app.sell');
    }
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
  });
};
