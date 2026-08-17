# Add project specific ProGuard rules here.

# Keep Retrofit and Gson model classes
-keepattributes Signature
-keepattributes *Annotation*

-keep class com.passnet.wifi.data.remote.** { *; }
-keep class com.passnet.wifi.domain.model.** { *; }

# OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }

# Retrofit
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Hilt
-keep class dagger.hilt.** { *; }
-keep @dagger.hilt.android.lifecycle.HiltViewModel class * extends androidx.lifecycle.ViewModel

# Room
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.**
