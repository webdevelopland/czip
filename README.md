## czip
### Compression and encryption of files and folders

#### Install
```javascript
npm install czip --global
```

#### Encrypt
item -> item.czip
```javascript
czip -e item
```

#### Decrypt
item.czip -> item
```javascript
czip -d item
// WRONG: czip d item.czip
```

#### Is the password correct?
```javascript
czip -v item
```

#### Session
Start session  
item.czip -> item
```javascript
czip -s item
```
When session is ended, item will be removed  

#### Session shortcuts
End session
```
Ctrl+C
```
or
```
Esc
```

Save session  
All local files will be encrypted to czip archive without ending the session.
```
Ctrl+S
```

#### Features
You're able to set password with a command. Example:
```javascript
czip -d item mySuperPass
```
