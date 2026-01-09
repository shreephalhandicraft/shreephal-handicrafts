# SEO Integration Examples

Practical examples showing how to add all SEO components to your pages.

---

## 👉 Example 1: Product Page (Complete SEO)

```jsx
// File: src/pages/ProductDetail.jsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

// Import all SEO components
import { SEOHead } from '@/components/SEO/SEOHead';
import { StructuredData } from '@/components/SEO/StructuredData';
import { OpenGraphTags } from '@/components/SEO/OpenGraphTags';
import { ProductSchema } from '@/components/SEO/ProductSchema';
import { BreadcrumbSchema } from '@/components/SEO/BreadcrumbSchema';
import { FAQSchema } from '@/components/SEO/FAQSchema';

function ProductDetail() {
  const { categorySlug, productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    // Fetch product data
    const fetchProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories!inner(*)')
        .eq('slug', productSlug)
        .eq('category_slug', categorySlug)
        .single();

      setProduct(data);
      setCategory(data.categories);
    };

    fetchProduct();
  }, [productSlug, categorySlug]);

  if (!product) return <div>Loading...</div>;

  // SEO Data
  const title = `${product.name} - ${category.name} | Shreephal Handicrafts`;
  const description = product.description || 
    `High-quality ${product.name} available at Shreephal Handicrafts. Custom engraving, fast delivery across India.`;
  const url = `/category/${categorySlug}/products/${productSlug}`;
  const price = product.price || '999';

  // Product FAQs
  const productFAQs = [
    {
      question: `Can I customize the ${product.name}?`,
      answer: 'Yes, we offer free custom engraving on all products. You can add names, dates, logos, or messages.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available for urgent orders.'
    },
    {
      question: 'What materials is this made from?',
      answer: product.material || 'Made from premium quality materials with attention to detail.'
    },
    {
      question: 'Do you offer bulk discounts?',
      answer: 'Yes! For orders of 10+ items, please contact us for special bulk pricing.'
    }
  ];

  return (
    <>
      {/* Basic SEO */}
      <SEOHead
        title={title}
        description={description}
        keywords={`${category.name}, ${product.name}, custom ${product.name}, trophy, award, engraving`}
      />

      {/* Social Media Previews */}
      <OpenGraphTags
        title={product.name}
        description={description}
        image={product.image}
        url={url}
        type="product"
      />

      {/* Product Rich Snippets (Stars, Price in Search Results) */}
      <ProductSchema
        name={product.name}
        description={description}
        image={product.image}
        price={price}
        currency="INR"
        availability={product.in_stock ? 'InStock' : 'OutOfStock'}
        rating={product.rating || '4.8'}
        reviewCount={product.review_count || '50'}
        sku={product.id}
        category={category.name}
      />

      {/* Breadcrumbs in Search Results */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: category.name, url: `/category/${categorySlug}` },
          { name: product.name, url: url }
        ]}
      />

      {/* FAQ Rich Snippets */}
      <FAQSchema faqs={productFAQs} />

      {/* Existing Structured Data */}
      <StructuredData type="product" data={product} />

      {/* Your existing product UI */}
      <div className="product-container">
        <h1>{product.name}</h1>
        <img src={product.image} alt={product.name} />
        <p>{product.description}</p>
        <p className="price">₹{price}</p>
        {/* ... rest of your product UI ... */}
      </div>

      {/* FAQ Section (visible to users too) */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        {productFAQs.map((faq, index) => (
          <details key={index}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export default ProductDetail;
```

**Expected Google Search Result**:
```
Golden Achievement Trophy - Trophies | Shreephal Handicrafts
https://shreephalhandicrafts.com › category › trophies › products › golden-trophy
★★★★★ 4.8 (50) · ₹999 · In stock
Home > Trophies > Golden Achievement Trophy

High-quality Golden Achievement Trophy available at Shreephal Handicrafts...

❓ Can I customize the Golden Achievement Trophy?
❓ How long does delivery take?
❓ What materials is this made from?
```

---

## 👉 Example 2: Category Page SEO

```jsx
// File: src/pages/CategoryProducts.jsx

import { SEOHead } from '@/components/SEO/SEOHead';
import { OpenGraphTags } from '@/components/SEO/OpenGraphTags';
import { BreadcrumbSchema } from '@/components/SEO/BreadcrumbSchema';
import { FAQSchema } from '@/components/SEO/FAQSchema';

function CategoryProducts({ category, products }) {
  const title = `${category.name} - Premium Custom ${category.name} | Shreephal Handicrafts`;
  const description = `Browse our collection of ${products.length}+ premium ${category.name}. Custom engraving, fast delivery. Perfect for achievements & awards.`;
  const url = `/category/${category.slug}/products`;

  // Category-specific FAQs
  const categoryFAQs = [
    {
      question: `What types of ${category.name} do you offer?`,
      answer: `We offer a wide range of ${category.name} including custom designs, different sizes, and materials. All products can be personalized with engraving.`
    },
    {
      question: `Can I order custom ${category.name} in bulk?`,
      answer: 'Yes! We specialize in bulk orders for corporate events, schools, and sports tournaments. Contact us for special pricing.'
    },
    {
      question: 'Do you provide free engraving?',
      answer: 'Yes, custom engraving is free on all products. You can add names, dates, logos, or messages at no extra cost.'
    }
  ];

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        keywords={`${category.name}, custom ${category.name}, buy ${category.name} online, ${category.name} India`}
      />

      <OpenGraphTags
        title={title}
        description={description}
        image={category.image || '/banner-hero.jpg'}
        url={url}
        type="website"
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: category.name, url: url }
        ]}
      />

      <FAQSchema faqs={categoryFAQs} />

      {/* Your category UI */}
      <div className="category-page">
        <h1>{category.name}</h1>
        <p>{description}</p>
        {/* Product grid */}
      </div>

      {/* FAQ section */}
      <div className="faq-section">
        <h2>Common Questions About {category.name}</h2>
        {categoryFAQs.map((faq, index) => (
          <details key={index}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}
```

---

## 👉 Example 3: Homepage SEO

```jsx
// File: src/pages/Home.jsx

import { SEOHead } from '@/components/SEO/SEOHead';
import { OpenGraphTags } from '@/components/SEO/OpenGraphTags';
import { LocalBusinessSchema } from '@/components/SEO/LocalBusinessSchema';
import { FAQSchema } from '@/components/SEO/FAQSchema';

function Home() {
  const homepageFAQs = [
    {
      question: 'What products do you offer?',
      answer: 'We specialize in premium trophies, awards, medals, photo frames, and custom gifts. All products can be personalized with engraving.'
    },
    {
      question: 'Do you ship across India?',
      answer: 'Yes, we ship to all states in India. International shipping is also available for select countries.'
    },
    {
      question: 'How do I place a custom order?',
      answer: 'Browse our products, select your item, and use the customization options to add text, logos, or special requests. You can also contact us directly for complex customizations.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major payment methods including credit/debit cards, UPI, net banking, and cash on delivery (select areas).'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return policy for defective or damaged products. Custom engraved items cannot be returned unless defective.'
    }
  ];

  return (
    <>
      <SEOHead
        title="Premium Handcrafted Trophies & Awards | Shreephal Handicrafts - Narnaund, Haryana"
        description="Custom trophies, awards, medals & gifts in Narnaund, Haryana. Free engraving, fast delivery across India. Celebrating achievements with unique, personalized products since 2020."
        keywords="trophies, awards, custom gifts, engraving, medals, photo frames, Narnaund, Haryana, India"
      />

      <OpenGraphTags
        title="Shreephal Handicrafts - Premium Trophies & Custom Awards"
        description="Custom trophies and awards for all occasions. Free engraving, fast delivery across India."
        image="/banner-hero.jpg"
        url="/"
        type="website"
      />

      {/* Local Business Schema - Helps with Local SEO */}
      <LocalBusinessSchema />

      {/* Homepage FAQs */}
      <FAQSchema faqs={homepageFAQs} />

      {/* Your homepage UI */}
      <div className="homepage">
        <Hero />
        <FeaturedCategories />
        <AboutUs />
        
        {/* Add visible FAQ section */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          {homepageFAQs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
      </div>
    </>
  );
}
```

---

## 👉 Example 4: About Page SEO

```jsx
// File: src/pages/About.jsx

import { SEOHead } from '@/components/SEO/SEOHead';
import { OpenGraphTags } from '@/components/SEO/OpenGraphTags';
import { BreadcrumbSchema } from '@/components/SEO/BreadcrumbSchema';

function About() {
  return (
    <>
      <SEOHead
        title="About Us - Shreephal Handicrafts | Premium Trophy Makers in Narnaund"
        description="Learn about Shreephal Handicrafts, a trusted trophy and award manufacturer in Narnaund, Haryana. Quality craftsmanship since 2020."
        keywords="about shreephal, trophy makers, Narnaund business, award manufacturers"
      />

      <OpenGraphTags
        title="About Shreephal Handicrafts"
        description="Premium trophy and award manufacturers in Narnaund, Haryana"
        image="/about-us-image.jpg"
        url="/about"
        type="website"
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'About Us', url: '/about' }
        ]}
      />

      {/* Your about page content */}
    </>
  );
}
```

---

## 📝 Step-by-Step Implementation Guide

### **Step 1: Update Homepage** (5 minutes)

1. Open `src/pages/Home.jsx` or your homepage component
2. Add imports:
   ```jsx
   import { SEOHead } from '@/components/SEO/SEOHead';
   import { OpenGraphTags } from '@/components/SEO/OpenGraphTags';
   import { LocalBusinessSchema } from '@/components/SEO/LocalBusinessSchema';
   import { FAQSchema } from '@/components/SEO/FAQSchema';
   ```
3. Add components at the top of your return statement
4. Test: Share homepage link on WhatsApp - should show rich preview

### **Step 2: Update Product Pages** (10 minutes)

1. Open your product detail component
2. Add all 6 SEO components (see Example 1)
3. Test with [Rich Results Test](https://search.google.com/test/rich-results)
4. Should show: Product, Breadcrumb, FAQ schemas

### **Step 3: Update Category Pages** (5 minutes)

1. Add SEO components to category listing
2. Include category-specific FAQs
3. Test breadcrumbs appear correctly

### **Step 4: Update Local Business Info** (5 minutes)

1. Open `src/components/SEO/LocalBusinessSchema.jsx`
2. Replace placeholder data:
   - Phone number
   - Email
   - Postal code
   - GPS coordinates (get from Google Maps)
   - Business hours
   - Social media URLs

### **Step 5: Generate Sitemap** (2 minutes)

1. Create a utility script:
   ```jsx
   // scripts/generate-sitemap.js
   import { generateSitemap } from '../src/utils/sitemapGenerator';
   import fs from 'fs';

   (async () => {
     const xml = await generateSitemap();
     fs.writeFileSync('./public/sitemap.xml', xml);
     console.log('Sitemap generated!');
   })();
   ```

2. Run:
   ```bash
   node scripts/generate-sitemap.js
   ```

3. Commit the new `sitemap.xml` to your repo

### **Step 6: Test Everything** (10 minutes)

✅ Test each page:
- [ ] Homepage
- [ ] Product page
- [ ] Category page
- [ ] About page

✅ Use these tools:
- [ ] [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### **Step 7: Submit to Search Engines** (5 minutes)

1. **Google Search Console**:
   - Go to https://search.google.com/search-console
   - Add property: `shreephalhandicrafts.com`
   - Submit sitemap: `https://shreephalhandicrafts.com/sitemap.xml`

2. **Bing Webmaster Tools**:
   - Go to https://www.bing.com/webmasters
   - Add site
   - Submit sitemap

---

## 🎯 Expected Results

### **Immediate (Within 24 hours)**:
- ✅ Rich social media previews
- ✅ Better looking links when shared
- ✅ Proper page titles/descriptions

### **Short-term (1-2 weeks)**:
- 📈 Product rich snippets in search
- 📈 FAQ accordions in search results
- 📈 Breadcrumbs in search results
- 📈 Star ratings display

### **Medium-term (1 month)**:
- 📈 Higher click-through rates (+30-50%)
- 📈 Better local search visibility
- 📈 More organic traffic
- 📈 Improved search rankings

### **Long-term (3+ months)**:
- 🚀 Established brand presence
- 🚀 Featured snippets
- 🚀 "People also ask" appearances
- 🚀 Top rankings for target keywords

---

## ⚠️ Common Mistakes to Avoid

1. **❌ Don't duplicate H1 tags**
   - Only ONE `<h1>` per page
   - Use `<h2>`, `<h3>` for subsections

2. **❌ Don't keyword stuff**
   ```jsx
   // Bad:
   <title>Trophies Trophy Award Trophy Buy Trophy Shop Trophy</title>
   
   // Good:
   <title>Premium Trophies & Awards | Shreephal Handicrafts</title>
   ```

3. **❌ Don't forget alt tags**
   ```jsx
   // Bad:
   <img src="trophy.jpg" alt="image123" />
   
   // Good:
   <img src="trophy.jpg" alt="Golden trophy with laurel wreath" />
   ```

4. **❌ Don't use generic descriptions**
   ```jsx
   // Bad:
   <meta name="description" content="Product page" />
   
   // Good:
   <meta name="description" content="Premium golden trophy with custom engraving. Perfect for achievements. Fast delivery across India." />
   ```

5. **❌ Don't forget mobile testing**
   - Test on actual mobile devices
   - Check mobile-friendly score
   - Verify tap targets aren't too small

---

## 📊 Tracking Success

### **Week 1 Metrics**:
- [ ] All pages have proper meta tags
- [ ] Rich results test passes
- [ ] Social sharing looks good
- [ ] Sitemap submitted

### **Month 1 Metrics**:
- [ ] Organic traffic increase
- [ ] Impressions in Search Console
- [ ] Click-through rate improving
- [ ] Pages getting indexed

### **Month 3 Metrics**:
- [ ] Rankings for target keywords
- [ ] Featured in rich snippets
- [ ] Conversions from organic traffic
- [ ] Backlinks increasing

---

## 🚀 Quick Wins Checklist

**Do These TODAY for Instant SEO Boost**:

- [ ] Add `OpenGraphTags` to all pages (social sharing)
- [ ] Add `ProductSchema` to product pages (star ratings)
- [ ] Add `FAQSchema` to homepage (FAQ in search)
- [ ] Update `LocalBusinessSchema` with real info
- [ ] Generate and submit sitemap
- [ ] Test with Rich Results Tool
- [ ] Share on social media to test previews

**Expected Time**: 30-45 minutes
**Expected Impact**: +20-30% CTR from search/social

---

**Ready to implement? Start with the homepage and product pages first - they'll give you the biggest SEO boost!**
