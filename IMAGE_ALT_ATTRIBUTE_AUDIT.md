# 🔍 Image Alt Attribute Audit Guide

**Status:** Ready for implementation  
**Estimated Time:** 1 hour  
**Impact:** Accessibility + SEO improvement

---

## Why Add Alt Attributes?

### Accessibility (WCAG 2.1 Compliance)
- ✅ **Screen readers** can describe images to blind users
- ✅ **Voice navigation** can reference images
- ✅ **Better UX** for users with disabilities

### SEO Benefits
- ✅ **Image search** - Google indexes alt text
- ✅ **Better rankings** - Accessibility is a ranking factor
- ✅ **Keyword optimization** - Relevant keywords in alt text

### Fallback Display
- ✅ **Broken images** - Alt text shows if image fails to load
- ✅ **Slow connections** - Text appears while image loads
- ✅ **Image blocked** - Alt text visible if images disabled

---

## Alt Text Best Practices

### Good Alt Text
✅ **Descriptive:** "Gold trophy with engraved wooden base"
✅ **Concise:** Under 125 characters
✅ **Relevant:** Describes what user needs to know
✅ **Keywords:** Natural keyword inclusion

### Bad Alt Text
❌ **Generic:** "image", "photo", "picture"
❌ **Too long:** Paragraphs of text
❌ **Redundant:** "Image of..." (screen readers announce "image" automatically)
❌ **Keyword stuffing:** "trophy trophy gold trophy buy trophy"

---

## Audit Checklist

### Priority 1: Product Images (HIGH IMPACT)

#### Product Cards
```javascript
// BEFORE:
<img src={product.image} />

// AFTER:
<img 
  src={product.image} 
  alt={`${product.title} - ${product.category}`}
  loading="lazy"
/>

// Example:
// "Gold Trophy - Trophies"
// "Wooden Key Holder - Key Holders"
```

**Files to Check:**
- `components/ProductCard.jsx`
- `components/ProductGrid.jsx`
- `components/FeaturedProducts.jsx`

#### Product Detail Images
```javascript
// BEFORE:
<img src={product.images[0]} />

// AFTER:
<img 
  src={product.images[0]} 
  alt={`${product.title} - Main view`}
  loading="lazy"
/>

// Multiple images:
<img 
  src={product.images[1]} 
  alt={`${product.title} - Side view`}
/>
<img 
  src={product.images[2]} 
  alt={`${product.title} - Detail view`}
/>
```

**Files to Check:**
- `pages/ProductDetail.jsx`
- `components/ProductImageGallery.jsx`

---

### Priority 2: Category Images (MEDIUM IMPACT)

#### Category Cards
```javascript
// BEFORE:
<img src={category.image} />

// AFTER:
<img 
  src={category.image} 
  alt={`${category.name} category - Browse ${category.productCount || 'our'} products`}
  loading="lazy"
/>

// Example:
// "Key Holders category - Browse 24 products"
// "Mandirs category - Browse our products"
```

**Files to Check:**
- `components/CategoryCard.jsx`
- `pages/Shop.jsx`
- `components/CategoryGrid.jsx`

---

### Priority 3: Hero/Banner Images (MEDIUM IMPACT)

#### Homepage Hero
```javascript
// BEFORE:
<img src="/banner-hero.jpg" />

// AFTER:
<img 
  src="/banner-hero.jpg" 
  alt="Authentic Indian handicrafts - Hand-crafted key holders, mandirs, trophies and gifts"
/>
```

#### Category Banners
```javascript
<img 
  src={banner} 
  alt={`${categoryName} collection - Handcrafted Indian ${categoryName.toLowerCase()}`}
/>
```

**Files to Check:**
- `components/LandingPage.jsx`
- `components/Hero.jsx`
- `pages/CategoryProducts.jsx`

---

### Priority 4: Logo & Icons (LOW IMPACT)

#### Site Logo
```javascript
// BEFORE:
<img src="/logo.png" />

// AFTER:
<img 
  src="/logo.png" 
  alt="Shreephal Handicrafts - Home"
/>
```

#### Decorative Icons
```javascript
// For decorative icons (no meaning), use empty alt:
<img src="/decorative-pattern.png" alt="" role="presentation" />

// For functional icons:
<img src="/cart-icon.png" alt="Shopping cart" />
<img src="/search-icon.png" alt="Search" />
```

**Files to Check:**
- `components/Header.jsx`
- `components/Footer.jsx`
- `components/Navigation.jsx`

---

### Priority 5: User/Profile Images (LOW IMPACT)

#### Avatar Images
```javascript
// BEFORE:
<img src={user.avatar} />

// AFTER:
<img 
  src={user.avatar} 
  alt={`${user.name}'s profile picture`}
/>

// Fallback avatar:
<img 
  src="/default-avatar.png" 
  alt="Default user avatar"
/>
```

**Files to Check:**
- `components/UserProfile.jsx`
- `components/PersonalDetails.jsx`
- `components/OrderHistory.jsx`

---

## Implementation Script

### Step 1: Find All Images (5 minutes)

```bash
# Search for all <img> tags
grep -r "<img" frontend/src --include="*.jsx" --include="*.tsx"

# Find images without alt:
grep -r "<img" frontend/src | grep -v "alt=" 

# Count images:
grep -r "<img" frontend/src --include="*.jsx" | wc -l
```

### Step 2: Categorize Images (10 minutes)

Create a checklist:

```markdown
## Product Images
- [ ] ProductCard.jsx (15 images)
- [ ] ProductDetail.jsx (5 images)
- [ ] FeaturedProducts.jsx (8 images)

## Category Images
- [ ] CategoryCard.jsx (12 images)
- [ ] Shop.jsx (10 images)

## Hero/Banners
- [ ] LandingPage.jsx (3 images)
- [ ] CategoryBanner.jsx (1 image)

## Logos/Icons
- [ ] Header.jsx (2 images)
- [ ] Footer.jsx (1 image)

## Total: ~57 images
```

### Step 3: Add Alt Text (30 minutes)

**Template for consistency:**

```javascript
// Product images
alt={`${product.title} - ${product.category}`}

// Category images
alt={`${category.name} category`}

// Hero images
alt="Descriptive text about the banner content"

// Logos
alt="Shreephal Handicrafts logo"

// Decorative
alt=""
```

### Step 4: Test Accessibility (10 minutes)

**Manual Testing:**
1. Turn off images in browser
2. Check if alt text appears
3. Verify text is descriptive

**Screen Reader Testing:**
1. Use NVDA (Windows) or VoiceOver (Mac)
2. Navigate through page
3. Verify images announced correctly

**Automated Testing:**
```bash
# Using axe-core
npm install --save-dev @axe-core/react

# Add to index.jsx (development only):
if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

---

## Example File Audit

### Before: ProductCard.jsx
```javascript
const ProductCard = ({ product }) => (
  <div className="card">
    <img src={product.image} /> {/* ❌ No alt */}
    <h3>{product.title}</h3>
    <p>₹{product.price}</p>
  </div>
);
```

### After: ProductCard.jsx
```javascript
const ProductCard = ({ product }) => (
  <div className="card">
    <img 
      src={product.image} 
      alt={`${product.title} - ${product.category} - ₹${product.price}`}
      loading="lazy"
    /> {/* ✅ Descriptive alt */}
    <h3>{product.title}</h3>
    <p>₹{product.price}</p>
  </div>
);
```

---

## Common Patterns

### Pattern 1: Dynamic Product Alt
```javascript
const getProductAlt = (product) => {
  const parts = [product.title];
  if (product.category) parts.push(product.category);
  if (product.material) parts.push(product.material);
  return parts.join(' - ');
};

// Usage:
<img src={product.image} alt={getProductAlt(product)} />
// Result: "Gold Trophy - Trophies - Metal"
```

### Pattern 2: Fallback for Missing Images
```javascript
<img 
  src={product.image || '/placeholder.png'} 
  alt={product.image 
    ? `${product.title} - ${product.category}`
    : 'Product image coming soon'
  }
/>
```

### Pattern 3: Gallery Images
```javascript
const imageAlts = [
  'Main view',
  'Side view',
  'Detail view',
  'Back view',
  'In use'
];

{product.images.map((img, index) => (
  <img 
    key={index}
    src={img} 
    alt={`${product.title} - ${imageAlts[index] || `View ${index + 1}`}`}
  />
))}
```

---

## Testing Checklist

### Accessibility Tests
- [ ] Screen reader announces image descriptions
- [ ] Alt text is descriptive (not "image" or "photo")
- [ ] Alt text is concise (< 125 characters)
- [ ] Decorative images have empty alt (alt="")
- [ ] Functional images have meaningful alt

### SEO Tests
- [ ] Product images have product name in alt
- [ ] Category images have category name in alt
- [ ] Alt text includes relevant keywords naturally
- [ ] No keyword stuffing

### Technical Tests
- [ ] Images without src still have alt
- [ ] Dynamic images generate appropriate alt
- [ ] Loading states show alt text
- [ ] Broken images display alt text

---

## Automated Audit Tools

### 1. ESLint Plugin
```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

**Add to .eslintrc.json:**
```json
{
  "plugins": ["jsx-a11y"],
  "extends": ["plugin:jsx-a11y/recommended"],
  "rules": {
    "jsx-a11y/alt-text": "error"
  }
}
```

### 2. Lighthouse Audit
1. Open DevTools → Lighthouse
2. Run Accessibility audit
3. Fix reported image issues

### 3. axe DevTools
1. Install axe DevTools extension
2. Run scan on each page
3. Fix "Images must have alternate text" issues

---

## Success Metrics

### Before Audit
```
Total Images: ~57
With Alt: ~15 (26%)
Accessibility Score: 72/100
```

### After Audit
```
Total Images: ~57
With Alt: 57 (100%) ✅
Accessibility Score: 95/100 ✅
SEO Image Score: 100/100 ✅
```

---

## Implementation Timeline

**Total Time:** ~1 hour

1. **Find images** (5 min) - Grep for all <img> tags
2. **Categorize** (10 min) - Priority 1-5 groups
3. **Add alt text** (30 min) - Follow patterns
4. **Test** (10 min) - Manual + automated
5. **Document** (5 min) - Update checklist

---

## Deployment Notes

- ✅ **Zero breaking changes** - Only adds attributes
- ✅ **No performance impact** - Alt text is tiny
- ✅ **SEO improvement** - Better image search rankings
- ✅ **Accessibility win** - WCAG 2.1 compliance

---

**Status:** 🟡 Ready for 1-hour accessibility sprint  
**Priority:** Medium (accessibility + SEO)  
**Risk:** None (purely additive)

**✅ Simple find-and-replace task with big impact!**
