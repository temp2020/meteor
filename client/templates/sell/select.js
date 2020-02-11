import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('SelectCtrl', SelectCtrl);

 function SelectCtrl (
                      $scope,
                      $state,
                      $reactive,
                      $rootScope,
                      $ionicLoading,
                      $ionicPlatform,
                      $ionicHistory,
                      $ionicViewSwitcher,
                      $cordovaDevice,
                      $ionicScrollDelegate,
                      $timeout,
                      $translate
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

    this.helpers({
        isLoading() { return Search.getStatus().loading }
    });

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
        $state.go('app.shop');
      }
    });

    $scope.$on('$ionicView.afterEnter', function (event, viewData) {
      if ( document.getElementById("content-main") !== null ) {
        $ionicLoading.hide();
      }
    });
};
