package com.passnet.wifi.data.local.dao

import androidx.room.*
import com.passnet.wifi.data.local.entity.TicketEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TicketDao {

    @Query("SELECT * FROM tickets ORDER BY createdAtEpoch DESC")
    fun observeAll(): Flow<List<TicketEntity>>

    @Query("SELECT * FROM tickets ORDER BY createdAtEpoch DESC")
    suspend fun getAll(): List<TicketEntity>

    @Query("SELECT * FROM tickets WHERE id = :id")
    suspend fun getById(id: String): TicketEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(ticket: TicketEntity)

    @Delete
    suspend fun delete(ticket: TicketEntity)

    @Query("DELETE FROM tickets WHERE id = :id")
    suspend fun deleteById(id: String)

    /** Delete tickets that expired before the given epoch second */
    @Query("DELETE FROM tickets WHERE expiresAtEpoch < :epochSecond")
    suspend fun deleteExpiredBefore(epochSecond: Long)

    @Query("SELECT COUNT(*) FROM tickets WHERE createdAtEpoch >= :dayStartEpoch")
    suspend fun countCreatedSince(dayStartEpoch: Long): Int
}
