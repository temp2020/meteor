angular
    .module('salephone')
    .controller('DailyDealsCtrl', DailyDealsCtrl);

 function DailyDealsCtrl (
    $scope, 
    $reactive, 
    $state, 
    $ionicLoading, 
    $ionicHistory,
    $ionicPopover
  ) {
    $reactive(this).attach($scope);
    
    this.language = window.localStorage.getItem('language') || 'en';

    $ionicPopover.fromTemplateUrl('client/templates/nav-links/daily_deals.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.links = popover;
    });

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };