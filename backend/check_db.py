import sqlite3

# 데이터베이스 연결
conn = sqlite3.connect('users.db')
cursor = conn.cursor()

print("=== 등록된 사용자 목록 ===")
cursor.execute("SELECT id, email, name, created_at FROM users")
users = cursor.fetchall()

print(f"{'ID':<5} {'Email':<25} {'Name':<15} {'Created At'}")
print("-" * 70)

for user in users:
    print(f"{user[0]:<5} {user[1]:<25} {user[2]:<15} {user[3] if user[3] else 'N/A'}")

print(f"\n총 {len(users)}명의 사용자가 등록되어 있습니다.")

print("\n=== 사용자 프로필 정보 ===")
cursor.execute("""
    SELECT p.user_id, u.name, u.email, p.sleep_type, p.home_time, 
           p.cleaning_frequency, p.cleaning_sensitivity, p.smoking_status, 
           p.noise_sensitivity, p.is_complete
    FROM user_profiles p
    JOIN users u ON p.user_id = u.id
""")
profiles = cursor.fetchall()

print(f"{'ID':<5} {'Name':<15} {'Sleep':<10} {'Home':<12} {'Clean':<10} {'Complete':<10}")
print("-" * 80)

for profile in profiles:
    user_id, name, email, sleep_type, home_time, clean_freq, clean_sens, smoking, noise, is_complete = profile
    print(f"{user_id:<5} {name:<15} {sleep_type or 'N/A':<10} {home_time or 'N/A':<12} {clean_freq or 'N/A':<10} {'Yes' if is_complete else 'No':<10}")

print(f"\n총 {len(profiles)}개의 프로필이 있습니다.")

# 완성된 프로필 수
completed_profiles = [p for p in profiles if p[9]]  # is_complete
print(f"완성된 프로필: {len(completed_profiles)}개")

conn.close()
