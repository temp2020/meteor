import { _meteorAngular } from 'meteor/angular';

angular
    .module('salephone')
    .config(translate)

function translate($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: 'languages/',
        suffix: '.json'
    });
    $translateProvider.translations('en');
    $translateProvider.translations('ar');
    $translateProvider.translations('fr');
    $translateProvider.translations('es');
    $translateProvider.translations('nl');
    $translateProvider.translations('it');
    $translateProvider.translations('de');
    $translateProvider.translations('ru');
    $translateProvider.translations('pt');
    $translateProvider.translations('jp');
    $translateProvider.translations('zhs');
    $translateProvider.translations('zht');
    $translateProvider.translations('sw');
    $translateProvider.translations('hi');
	$translateProvider.preferredLanguage('en');
    $translateProvider.useLocalStorage();
    $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
}
