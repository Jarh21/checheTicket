package com.passnet.wifi.data.remote.license

import com.passnet.wifi.data.remote.license.dto.*
import retrofit2.http.*

interface LicenseApi {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("auth/session")
    suspend fun getSession(): SessionResponse

    @POST("auth/logout")
    suspend fun logout(): MessageResponse

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): MessageResponse

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): MessageResponse
}
