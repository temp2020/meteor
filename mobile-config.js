App.accessRule( "blob:*" );

App.info({
  id: 'com.vastershops.app',
  name: 'Vastershops',
  description: 'The new way of selling, the new way of shopping',
  author: 'Vastershops',
  email: 'support@vastershops.com',
  website: 'vastershops.com',
  version: '1.8.2.04'
});

App.configurePlugin('cordova-plugin-googleplus', {
  PLAY_SERVICES_VERSION: '16.+',
});

App.configurePlugin('cordova-plugin-request-location-accuracy', {
  PLAY_SERVICES_LOCATION_VERSION: '16.+',
});

App.configurePlugin('cordova-android-firebase-gradle-release', {
  FIREBASE_VERSION: '15.+',
});

App.addResourceFile('google-services.json', 'google-services.json', 'android');

App.appendToConfig(`
  <custom-preference name="android-manifest/uses-feature/[@android:name='android.hardware.location.gps']/@android:required" value="false" />
`);

App.setPreference("AutoHideSplashScreen", "false");
App.setPreference("ShowSplashScreenSpinner", "false");

App.icons({
  'android_mdpi': 'mobile/icons/vs_noir_48.png', //(48x48)
  'android_hdpi': 'mobile/icons/vs_noir_72.png', //(72x72)
  'android_xhdpi': 'mobile/icons/vs_noir_96.png', //(96x96)
  'android_xxhdpi': 'mobile/icons/vs_noir_144.png', //(144x144)
  'android_xxxhdpi': 'mobile/icons/vs_noir_192.png' //(192x192)
  //'iphone_2x': '', //(120x120)
  //'iphone_3x': '', //(180x180)
  //'ipad': '', //(76x76)
  //'ipad_2x': '', //(152x152)
  //'ipad_pro': '', //(167x167)
  //'ios_settings': '', //(29x29)
  //'ios_settings_2x': '', //(58x58)
  //'ios_settings_3x': '', //(87x87)
  //'ios_spotlight': '', //(40x40)
  //'ios_spotlight_2x': '', //(80x80)
});

App.launchScreens({
  'android_mdpi_portrait': 'mobile/splash/vs_noir_320x480.png', //(320x470)
  'android_mdpi_landscape': 'mobile/splash/vs_noir_480x320.png', //(470x320)
  'android_hdpi_portrait': 'mobile/splash/vs_noir_480x640.png', //(480x640)
  'android_hdpi_landscape': 'mobile/splash/vs_noir_640x480.png', //(640x480)
  'android_xhdpi_portrait': 'mobile/splash/vs_noir_720x960.png', //(720x960)
  'android_xhdpi_landscape': 'mobile/splash/vs_noir_960x720.png', //(960x720)
  'android_xxhdpi_portrait': 'mobile/splash/vs_noir_1080x1440.png', //(1080x1440)
  'android_xxhdpi_landscape': 'mobile/splash/vs_noir_1440x1080.png' //(1440x1080)
  //'iphone_2x': '', //(640x960)
  //'iphone5': '', //(640x1136)
  //'iphone6': '', //(750x1334)
  //'iphone6p_portrait': '', //(1242x2208)
  //'iphone6p_landscape': '', //(2208x1242)
  //'ipad_portrait': '', //(768x1024)
  //'ipad_portrait_2x': '', //(1536x2048)
  //'ipad_landscape': '', //(1024x768)
  //'ipad_landscape_2x': '', //(2048x1536)
});

App.accessRule( "http://data.fixer.io" );
App.accessRule( "https://google.com" );
App.accessRule( "https://facebook.com" );
App.accessRule( "https://geocoder.api.here.com" );
App.accessRule( "https://reverse.geocoder.api.here.com" );
App.accessRule( "https://unpkg.com/@fortawesome/fontawesome-free@5.9.0/*" );
