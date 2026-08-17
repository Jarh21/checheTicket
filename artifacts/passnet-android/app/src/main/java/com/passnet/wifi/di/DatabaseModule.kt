package com.passnet.wifi.di

import android.content.Context
import com.passnet.wifi.data.local.AppDatabase
import com.passnet.wifi.data.local.dao.PlanDao
import com.passnet.wifi.data.local.dao.TicketDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        AppDatabase.create(context)

    @Provides
    fun providePlanDao(db: AppDatabase): PlanDao = db.planDao()

    @Provides
    fun provideTicketDao(db: AppDatabase): TicketDao = db.ticketDao()
}
