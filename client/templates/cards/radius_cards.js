angular
    .module('salephone')
    .controller('RadiusCardsCtrl', RadiusCardsCtrl);

 function RadiusCardsCtrl ($scope, $reactive, $state, $ionicLoading, $ionicHistory) {
    $reactive(this).attach($scope);

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };