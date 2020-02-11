angular
    .module('salephone')
    .controller('StoreCtrl', StoreCtrl);

 function StoreCtrl (
   $scope, 
   $reactive, 
   $ionicLoading, 
   $stateParams,
   $sce
  ) {
    $reactive(this).attach($scope);
    const self = this;
    this.store = {};

    this.subscribe('storeDetails', () => [ $stateParams.storeId ], {
      onReady: function() {
        self.store = Stores.findOne({ _id: $stateParams.storeId });
        return;
      }
    });

    this.description = function(description) {
      return $sce.trustAsHtml(description);
    }

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };