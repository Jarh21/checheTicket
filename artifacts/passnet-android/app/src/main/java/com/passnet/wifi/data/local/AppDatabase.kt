package com.passnet.wifi.data.local

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import android.content.Context
import com.passnet.wifi.data.local.dao.PlanDao
import com.passnet.wifi.data.local.dao.TicketDao
import com.passnet.wifi.data.local.entity.PlanEntity
import com.passnet.wifi.data.local.entity.TicketEntity

@Database(
    entities = [PlanEntity::class, TicketEntity::class],
    version  = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun planDao(): PlanDao
    abstract fun ticketDao(): TicketDao

    companion object {
        private const val DB_NAME = "passnet_wifi.db"

        fun create(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, DB_NAME)
                .fallbackToDestructiveMigration()
                .build()
    }
}
