# SSL Fix Guide for transporthsrp.com & transportsinfo.com

**Server**: srv1.my-cloud-server.com (WHM + CloudLinux + LiteSpeed)  
**Domains**: transporthsrp.com, transportsinfo.com  
**Issue**: SSL certificate problems

---

## Diagnosis Summary

Based on initial checks:
- ❌ SSL handshake timeout on transporthsrp.com
- ❌ Likely same issue on transportsinfo.com
- 🔍 Need to check: certificate expiry, DNS, AutoSSL status

---

## Step-by-Step Fix Process

### Step 1: SSH to Server

```bash
ssh root@srv1.my-cloud-server.com
# Password: Sk!CGFg&HMPN=PfC
```

---

### Step 2: Check SSL Status

```bash
# Check if SSL certificates exist
ls -la /etc/ssl/certs/ | grep -E "(transporthsrp|transportsinfo)"

# Check cPanel user SSL storage
ls -la /var/cpanel/ssl/installed/

# Check AutoSSL logs
ls -la /var/cpanel/logs/autossl/
```

---

### Step 3: Identify the cPanel User

```bash
# Find which cPanel user owns these domains
grep -r "transporthsrp.com" /etc/userdomains
grep -r "transportsinfo.com" /etc/userdomains

# Or check all domains
cat /etc/userdomains | grep -E "(transporthsrp|transportsinfo)"
```

**Expected Output**:
```
transporthsrp.com: username1
transportsinfo.com: username2
```

---

### Step 4: Force AutoSSL Renewal

```bash
# For transporthsrp.com user (replace USERNAME1 with actual username)
/scripts/autossl_check --user=USERNAME1

# For transportsinfo.com user (replace USERNAME2 with actual username)
/scripts/autossl_check --user=USERNAME2

# Or force renewal for all users
/scripts/autossl_check --all
```

---

### Step 5: Check AutoSSL Provider

```bash
# Check which AutoSSL provider is configured
cat /var/cpanel/autossl_provider.json

# Common providers:
# - cPanel (powered by Sectigo)
# - Let's Encrypt
```

---

### Step 6: Manual SSL Installation (if AutoSSL fails)

#### Option A: Via WHM GUI
```
1. Login to WHM: https://srv1.my-cloud-server.com:2087
2. Navigate to: SSL/TLS → Install an SSL Certificate on a Domain
3. Enter domain: transporthsrp.com
4. Click "Autofill by Domain"
5. Click "Install"
6. Repeat for transportsinfo.com
```

#### Option B: Via Command Line
```bash
# Generate CSR (if needed)
openssl req -new -newkey rsa:2048 -nodes -keyout transporthsrp.key -out transporthsrp.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=transporthsrp.com"

# Install existing certificate
/scripts/installssl --domain transporthsrp.com
```

---

### Step 7: Restart LiteSpeed

```bash
# Graceful restart
/usr/local/lsws/bin/lswsctrl graceful

# Or full restart
/usr/local/lsws/bin/lswsctrl restart

# Check status
/usr/local/lsws/bin/lswsctrl status
```

---

### Step 8: Verify DNS Configuration

```bash
# Check if domains resolve to this server
dig +short transporthsrp.com
dig +short transportsinfo.com

# Check A records
dig A transporthsrp.com +short
dig A transportsinfo.com +short

# Verify they match server IP
hostname -I
```

**Important**: AutoSSL requires DNS to point to the server!

---

### Step 9: Check for Common Issues

#### Issue 1: Domain Not Pointing to Server
```bash
# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"

# Check domain IPs
for domain in transporthsrp.com transportsinfo.com; do
  DOMAIN_IP=$(dig +short $domain | head -1)
  echo "$domain resolves to: $DOMAIN_IP"
  
  if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "⚠️  WARNING: $domain does not point to this server!"
  fi
done
```

#### Issue 2: Firewall Blocking Port 443
```bash
# Check if port 443 is open
iptables -L -n | grep 443

# Or using csf (ConfigServer Security & Firewall)
csf -g 443
```

#### Issue 3: LiteSpeed SSL Not Enabled
```bash
# Check LiteSpeed SSL configuration
grep -i ssl /usr/local/lsws/conf/httpd_config.conf

# Check virtual host SSL settings
cat /usr/local/lsws/conf/vhosts/transporthsrp.com/vhost.conf 2>/dev/null || echo "No vhost config found"
```

---

### Step 10: Test SSL After Fix

```bash
# Test SSL certificate
echo | openssl s_client -servername transporthsrp.com -connect transporthsrp.com:443 2>/dev/null | openssl x509 -noout -text | head -20

# Check certificate dates
echo | openssl s_client -servername transporthsrp.com -connect transporthsrp.com:443 2>/dev/null | openssl x509 -noout -dates

# Test HTTPS connection
curl -I https://transporthsrp.com 2>/dev/null | head -5
```

---

## Common Error Messages & Fixes

### Error: "Certificate Expired"
```bash
# Force renewal
/scripts/autossl_check --user=USERNAME --force

# Or delete old cert and regenerate
rm /var/cpanel/ssl/installed/certs/transporthsrp_com_*.crt
/scripts/autossl_check --user=USERNAME
```

### Error: "Domain does not resolve"
```bash
# Check DNS propagation
dig @8.8.8.8 transporthsrp.com +short

# Wait for DNS propagation (can take 24-48 hours)
# Or update DNS to point to correct server IP
```

### Error: "Rate limit exceeded" (Let's Encrypt)
```bash
# Wait 1 hour before retrying
# Or switch to cPanel/Sectigo provider
WHM → Manage AutoSSL → Choose Provider → cPanel
```

### Error: "LiteSpeed SSL handshake failed"
```bash
# Rebuild LiteSpeed config
/scripts/rebuildhttpdconf

# Restart LiteSpeed
/usr/local/lsws/bin/lswsctrl restart
```

---

## Post-Fix Checklist

- [ ] SSL certificate installed and valid
- [ ] HTTPS loads without warnings
- [ ] HTTP redirects to HTTPS
- [ ] Mixed content fixed (if WordPress)
- [ ] AutoSSL scheduled for renewal
- [ ] LiteSpeed restarted successfully

---

## WordPress-Specific Fixes (if applicable)

```bash
# If sites are WordPress, fix mixed content
# Update site URL to HTTPS
wp search-replace 'http://transporthsrp.com' 'https://transporthsrp.com' --allow-root

# Or via MySQL
mysql -e "UPDATE wp_options SET option_value = 'https://transporthsrp.com' WHERE option_name = 'siteurl';"
mysql -e "UPDATE wp_options SET option_value = 'https://transporthsrp.com' WHERE option_name = 'home';"
```

---

## Monitoring

```bash
# Set up SSL expiry monitoring
# Add to cron (runs daily at 3 AM)
echo "0 3 * * * root /scripts/autossl_check --all" | crontab -

# Check SSL expiry dates daily
for domain in transporthsrp.com transportsinfo.com; do
  expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
  echo "$domain SSL expires: $expiry"
done
```

---

## Quick Command Reference

```bash
# SSH to server
ssh root@srv1.my-cloud-server.com

# Force AutoSSL
/scripts/autossl_check --user=USERNAME

# Restart LiteSpeed
/usr/local/lsws/bin/lswsctrl restart

# Check SSL
openssl s_client -connect DOMAIN:443 -servername DOMAIN

# Check DNS
dig DOMAIN +short

# Check logs
tail -f /var/cpanel/logs/autossl/nc_ssl_log-*
```

---

## Support Resources

- **cPanel Docs**: https://docs.cpanel.net/knowledge-base/security/tls-ssl/
- **LiteSpeed Docs**: https://docs.litespeedtech.com/
- **CloudLinux Docs**: https://docs.cloudlinux.com/

