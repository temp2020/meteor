angular
    .module('salephone')
    .controller('MyStoreCtrl', MyStoreCtrl);

function MyStoreCtrl (
  $scope, 
  $reactive, 
  $ionicLoading, 
  $sce,
  $ionicPopover
) {
    $reactive(this).attach($scope);
    const self = this;

    if( window.localStorage.getItem('language') ){
      this.language = window.localStorage.getItem('language');
    }
    else{
      this.language = 'en';
    }

    $ionicPopover.fromTemplateUrl('client/templates/nav-links/my_shop.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.links = popover;
    });

    this.helpers({
      store: () => Stores.findOne({ userId: Meteor.userId() })
    });

    this.description = function(description) {
      return $sce.trustAsHtml(description);
    }

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };