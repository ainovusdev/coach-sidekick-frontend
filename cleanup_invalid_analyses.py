#!/usr/bin/env python3
"""
Cleanup script to remove or fix invalid analyses with empty coaching_scores.
This script will delete analyses that have empty coaching_scores or go_live_scores.
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete, update, text
import json

# Database URL - update this with your actual database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://coach_user:change_me_in_production@localhost:5432/coach_sidekick")

async def cleanup_invalid_analyses():
    """Clean up analyses with empty or invalid scores"""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # First, let's check how many analyses we have with issues
            total_query = text("SELECT COUNT(*) FROM analyses")
            result = await session.execute(total_query)
            total_count = result.scalar()
            print(f"Total analyses in database: {total_count}")
            
            # Count invalid analyses
            count_query = text("""
                SELECT COUNT(*) 
                FROM analyses 
                WHERE coaching_scores = '{}'::jsonb 
                   OR go_live_scores = '{}'::jsonb
                   OR coaching_scores IS NULL
                   OR go_live_scores IS NULL
            """)
            
            result = await session.execute(count_query)
            invalid_count = result.scalar()
            print(f"Found {invalid_count} invalid analyses")
            
            if invalid_count > 0:
                # Delete invalid analyses
                delete_query = text("""
                    DELETE FROM analyses 
                    WHERE coaching_scores = '{}'::jsonb 
                       OR go_live_scores = '{}'::jsonb
                       OR coaching_scores IS NULL
                       OR go_live_scores IS NULL
                    RETURNING id, session_id, created_at
                """)
                
                result = await session.execute(delete_query)
                deleted_analyses = result.fetchall()
                
                print(f"\nDeleted {len(deleted_analyses)} invalid analyses:")
                for analysis in deleted_analyses:
                    print(f"  - Analysis ID: {analysis[0]}, Session ID: {analysis[1]}, Created: {analysis[2]}")
                
                await session.commit()
                print("\nCleanup completed successfully!")
            else:
                print("No invalid analyses found. Database is clean!")
                
        except Exception as e:
            print(f"Error during cleanup: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()

async def verify_remaining_analyses():
    """Verify that remaining analyses are valid"""
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            
            # Check remaining analyses
            check_query = text("""
                SELECT id, session_id, 
                       jsonb_typeof(coaching_scores) as cs_type,
                       jsonb_typeof(go_live_scores) as gls_type,
                       CASE 
                           WHEN coaching_scores = '{}'::jsonb THEN 'empty'
                           WHEN coaching_scores IS NULL THEN 'null'
                           ELSE 'valid'
                       END as cs_status,
                       CASE 
                           WHEN go_live_scores = '{}'::jsonb THEN 'empty'
                           WHEN go_live_scores IS NULL THEN 'null'
                           ELSE 'valid'
                       END as gls_status
                FROM analyses
                LIMIT 10
            """)
            
            result = await session.execute(check_query)
            analyses = result.fetchall()
            
            print("\nSample of remaining analyses:")
            for analysis in analyses:
                print(f"  ID: {analysis[0][:8]}..., Session: {analysis[1][:8]}..., "
                      f"CS: {analysis[4]}, GLS: {analysis[5]}")
                      
        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    print("=== Cleaning up invalid analyses ===")
    print("This will delete analyses with empty coaching_scores or go_live_scores")
    print()
    
    # Get user confirmation
    response = input("Do you want to proceed? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        asyncio.run(cleanup_invalid_analyses())
        print("\n=== Verifying remaining analyses ===")
        asyncio.run(verify_remaining_analyses())
    else:
        print("Cleanup cancelled.")