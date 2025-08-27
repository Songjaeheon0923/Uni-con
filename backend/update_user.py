#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sqlite3
import sys

def update_user_name():
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # Update user name with proper UTF-8 encoding
        cursor.execute('UPDATE users SET name = ? WHERE id = ?', ('문유빈', 8))
        conn.commit()
        
        # Verify the update
        cursor.execute('SELECT id, name, email FROM users WHERE id = 8')
        result = cursor.fetchone()
        
        if result:
            print(f"Successfully updated user {result[0]}: {result[1]} ({result[2]})")
        else:
            print("User not found")
            
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_user_name()