# CZIP
Nodejs console app for file encryption

## Install
```javascript
npm install czip --global
```

## Encrypt
Encrypt "item" folder into "item.czip" archive
```javascript
czip -e item
```

## Decrypt
Decrypt "item.czip" archive into "item" folder
```javascript
czip -d item
// WARNING: You should not write ".czip" extention when you decrypt
```

## Is the password correct?
```javascript
czip -p item
```

## Current version
```javascript
czip -v
```

## Help
```javascript
czip -h
```

## Features
You're able to set a password in arguments. Example:
```javascript
czip -e "my folder" mySuperPass
```

## See also
Web version:  
https://github.com/webdevelopland/cryptozip
