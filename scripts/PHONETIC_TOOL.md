# Tool cập nhật phonetic

Tool đọc các dòng `words.phonetic` đang rỗng từ Supabase và sinh file SQL cập nhật.
Tool không ghi trực tiếp vào database và không ghi đè phonetic đã tồn tại.

## Cách hoạt động

- Từ đơn: tra IPA bằng Free Dictionary API.
- Idiom, collocation và phrasal verb: tách thành từng từ, tra từng IPA rồi ghép lại.
- Token không có trên API: thử thư viện offline `eng_to_ipa`.
- Nếu vẫn còn token không xác định: đưa dòng vào CSV suspect, không sinh câu UPDATE.

IPA của cụm từ là IPA ghép theo từng từ, không biểu diễn connected speech.

## Cài fallback

```powershell
python -m pip install eng-to-ipa
```

## Chạy thử 50 dòng

```powershell
python scripts/build_missing_phonetics_update.py --limit 50
```

## Chạy toàn bộ dòng public thiếu phonetic

```powershell
python scripts/build_missing_phonetics_update.py
```

## Chạy riêng một nhóm topic

```powershell
python scripts/build_missing_phonetics_update.py --topic "Idioms & Collocations"
```

## File kết quả

- `data/missing_phonetics_update.sql`: chạy trong Supabase SQL Editor.
- `data/missing_phonetics_preview.csv`: kiểm tra các IPA chuẩn bị cập nhật.
- `data/missing_phonetics_suspect.csv`: sửa thủ công các dòng không tra đủ IPA.
- `data/phonetic_lookup_cache.json`: cache để những lần chạy sau nhanh hơn.

Tool mặc định dùng Supabase URL và anon key trong `index.html`, nên chỉ đọc được topic
public. Muốn xử lý topic riêng tư, truyền access token của user bằng `--access-token`.

