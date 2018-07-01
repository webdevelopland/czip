## czipper
### Compression and encryption of files and folders

Install
```javascript
npm install czip --global
```

Encrypt
```javascript
// item -> item.czip
czip e item
```

Decrypt
```javascript
// item.czip -> item
czip d item
// WRONG: czip d item.czip
```

Start session
```javascript
// item.czip -> item
czip s item
// Remove item, when session is ended
```

Is the password correct?
```javascript
czip v item
```
