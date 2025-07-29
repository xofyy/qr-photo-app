with open("app/schemas/__init__.py", "rb") as file:
    content = file.read()

# Remove null bytes
cleaned_content = content.replace(b"\x00", b"")

with open("app/schemas/__init__.py", "wb") as file:
    file.write(cleaned_content)