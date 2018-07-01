## czipper
### Compression and encryption of files and folders

Install
```javascript
npm install czip --global
```

Encrypt
```javascript
// item -> item.czip
czip e <item name>
```

Decrypt
```javascript
// item.czip -> item
czip d <czip archive name>
```

Start session
```javascript
// item.czip -> item
czip s <czip archive name>
// Remove item, when session is ended
```

Is the password correct?
```javascript
czip v <czip archive name>
```
