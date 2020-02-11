angular
    .module('salephone')
    .controller('DayCardsCtrl', DayCardsCtrl);

 function DayCardsCtrl ($scope, $reactive, $state, $ionicLoading, $ionicHistory) {
    $reactive(this).attach($scope);

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };