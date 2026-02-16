# Server Credentials - WHM with CloudLinux + LiteSpeed

**Server**: srv1.my-cloud-server.com  
**Username**: root  
**Password**: Sk!CGFg&HMPN=PfC  
**Panel**: WHM (Web Host Manager)  
**OS**: CloudLinux  
**Web Server**: LiteSpeed  

---

## Client Sites with SSL Issues

### Site 1: transporthsrp.com
**Issue**: SSL certificate problem

### Site 2: transportsinfo.com  
**Issue**: SSL certificate problem

---

## Common SSL Issues on WHM/cPanel

### 1. AutoSSL Failures
```bash
# Check AutoSSL logs
tail -f /var/cpanel/logs/autossl/nc_ssl_log-*

# Force AutoSSL renewal
/usr/local/cpanel/bin/autossl_check --user=USERNAME
```

### 2. Certificate Expired
```bash
# Check certificate expiry
echo | openssl s_client -servername transporthsrp.com -connect transporthsrp.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew via WHM
WHM → SSL/TLS → Manage AutoSSL → Run AutoSSL
```

### 3. Mixed Content (HTTP/HTTPS)
```bash
# Check for mixed content
curl -s https://transporthsrp.com | grep -i "http://"

# Fix in WordPress/database
# Update all http:// to https://
```

### 4. Certificate Not Installed
```bash
# Install SSL via WHM
WHM → SSL/TLS → Install an SSL Certificate on a Domain

# Or via command line
/scripts/installssl --domain transporthsrp.com
```

---

## Quick Fix Steps

### Step 1: Check Current SSL Status
```bash
# SSH to server
ssh root@srv1.my-cloud-server.com

# Check SSL for both domains
for domain in transporthsrp.com transportsinfo.com; do
  echo "=== $domain ==="
  echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -subject -dates -issuer
  echo ""
done
```

### Step 2: Run AutoSSL
```bash
# Force AutoSSL for all users
/usr/local/cpanel/scripts/autossl_check --all

# Or for specific user
/usr/local/cpanel/scripts/autossl_check --user=USERNAME
```

### Step 3: Check LiteSpeed Configuration
```bash
# Restart LiteSpeed
/usr/local/lsws/bin/lswsctrl restart

# Check SSL configuration
grep -r "SSL" /usr/local/lsws/conf/
```

### Step 4: Verify DNS
```bash
# Check DNS resolution
dig transporthsrp.com +short
dig transportsinfo.com +short

# Check if pointing to correct server
nslookup transporthsrp.com
```

---

## WHM SSL/TLS Navigation

```
WHM → SSL/TLS
├── Manage AutoSSL
├── Install an SSL Certificate on a Domain
├── Manage SSL Hosts
├── Purchase and Install SSL
└── SSL Storage Manager
```

---

## Security Note

⚠️ **Important**: These credentials should be:
- Stored in a password manager
- Rotated regularly
- Never shared in plain text
- Used only via secure connections

---

## Next Steps

1. SSH to server and diagnose SSL issues
2. Run AutoSSL for both domains
3. Check LiteSpeed SSL configuration
4. Verify DNS is correct
5. Test HTTPS access after fixes

