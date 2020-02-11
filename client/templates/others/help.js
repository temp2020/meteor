angular
    .module('salephone')
    .controller('HelpCtrl', HelpCtrl);

 function HelpCtrl ($scope, $reactive, $state, $ionicLoading, $ionicHistory) {
    $reactive(this).attach($scope);

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };