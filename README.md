# czip
Compression and encryption of files and folders

## Install
```javascript
npm install czip --global
```

## Encrypt
item > item.czip
```javascript
czip -e item
```

## Decrypt
item.czip > item
```javascript
czip -d item
// WRONG: czip d item.czip
```

## Is the password correct?
```javascript
czip -p item
```
Exit shortcuts:
```
Ctrl+C or Esc
```

## Session
Start session.  
item.czip > item
```javascript
czip -s item
```
When session is ended, item will be removed.  

### Shortcuts & commands
You can use it while session is open.  

#### End session
Shortcuts:
```
Ctrl+C or Esc
```
Command:
```
exit
```

#### Save session  
All local files will be encrypted to czip archive without ending the session.  

Shortcut:
```
Ctrl+S
```
Command:
```
save
```

## Change password
```javascript
czip -n item
```

## Features
You're able to set password in arguments. Example:
```javascript
czip -d item mySuperPass
```

Current version
```javascript
czip -v
```

Help
```javascript
czip -h
```
