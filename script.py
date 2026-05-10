import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('C:/Users/MY PC/.gemini/antigravity/brain/ea02e04d-8254-4ba0-994d-855b26293a1a/scratch/alter_public_data.sql', 'r', encoding='utf-8') as f:
    alter_code = f.read()

with open('C:/Users/MY PC/Downloads/hi_migration.sql', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("v_user_id UUID := '<YOUR_USER_UUID>';", "v_user_id UUID := NULL;")

with open('C:/Users/MY PC/Downloads/files/global_migration.sql', 'w', encoding='utf-8') as f:
    f.write(alter_code + '\n\n' + content)

print('Success!')
