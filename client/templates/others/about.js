import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('AboutCtrl', AboutCtrl);

 function AboutCtrl ($scope, $reactive, $state, $ionicLoading, $ionicHistory) {
    $reactive(this).attach($scope);

    if( window.localStorage.getItem('language') ){
        this.language = window.localStorage.getItem('language');
    }
    else {
        this.language = 'en';
    }

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };