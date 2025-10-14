package com.veterinaire.formulaireveterinaire.serviceimpl;
import com.veterinaire.formulaireveterinaire.DAO.ProductRepository;
import com.veterinaire.formulaireveterinaire.entity.Product;
import com.veterinaire.formulaireveterinaire.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductServiceImpl.class);

    @Autowired
    private ProductRepository productRepository;

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Override
    public Product createProduct(Product product) {
        // If detailsUrl is provided and imageUrl is not set, attempt to scrape the image
        if (product.getDetailsUrl() != null && (product.getImageUrl() == null || product.getImageUrl().isEmpty())) {
            try {
                String scrapedImageUrl = scrapeProductImage(product.getDetailsUrl());
                if (scrapedImageUrl != null) {
                    product.setImageUrl(scrapedImageUrl);
                    logger.info("Successfully scraped image URL: {}", scrapedImageUrl);
                } else {
                    logger.warn("No image found on detailsUrl: {}", product.getDetailsUrl());
                    // Set a default placeholder if no image found
                    product.setImageUrl("https://via.placeholder.com/300x300?text=No+Image");
                }
            } catch (IOException e) {
                logger.error("Error scraping image from {}: {}", product.getDetailsUrl(), e.getMessage());
                // Fallback to placeholder
                product.setImageUrl("https://via.placeholder.com/300x300?text=Error+Loading");
            }
        }

        return productRepository.save(product);
    }

    private String scrapeProductImage(String url) throws IOException {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .timeout(10000) // 10-second timeout
                    .get();

            // Prioritize product images within figure or anchor tags
            Elements images = doc.select("figure img, a img[src*='files/live/sites/virbac-tn/files']");

            // Broader selectors if specific fails
            if (images.isEmpty()) {
                images = doc.select("img[src*='files/live/sites/virbac-tn/files']");
            }
            if (images.isEmpty()) {
                images = doc.select("img[src*='packshot'], img[class*='packshot'], img[alt*='product']");
            }
            if (images.isEmpty()) {
                images = doc.select("img[src*='product'], .product-image img, .main-image img, img[itemprop='image']");
            }
            if (images.isEmpty()) {
                images = doc.select("img[width>=200], img[height>=200]");
            }
            if (images.isEmpty()) {
                images = doc.select("img");
            }

            // Debug: Log all found images
            logger.debug("Found {} potential images on {}", images.size(), url);
            for (Element img : images) {
                String src = img.attr("src");
                String dataSrc = img.attr("data-src");
                if (!src.isEmpty()) {
                    logger.debug("Candidate image src: {}", src);
                } else if (!dataSrc.isEmpty()) {
                    logger.debug("Candidate image data-src: {}", dataSrc);
                }
                if (src.contains("files/live/sites/virbac-tn/files") || dataSrc.contains("files/live/sites/virbac-tn/files")) {
                    logger.debug("Prioritized image candidate: {}", src.isEmpty() ? dataSrc : src);
                }
            }

            if (!images.isEmpty()) {
                Element firstImage = null;
                // Prioritize an image with Virbac file path
                for (Element img : images) {
                    String src = img.attr("src");
                    String dataSrc = img.attr("data-src");
                    if (!src.isEmpty() && src.contains("files/live/sites/virbac-tn/files")) {
                        firstImage = img;
                        break;
                    } else if (src.isEmpty() && !dataSrc.isEmpty() && dataSrc.contains("files/live/sites/virbac-tn/files")) {
                        firstImage = img;
                        src = dataSrc; // Use data-src if src is empty
                        break;
                    }
                }
                // Fallback to first image if no prioritized one
                if (firstImage == null) {
                    firstImage = images.first();
                }

                String src = firstImage.attr("src").isEmpty() ? firstImage.attr("data-src") : firstImage.attr("src");
                // Make absolute URL
                if (src.startsWith("/")) {
                    src = "https://tn.virbac.com" + src;
                } else if (!src.startsWith("http")) {
                    String base = url.substring(0, url.lastIndexOf("/") + 1);
                    src = base + src;
                }
                // Verify it's an image URL
                if (!src.endsWith("/") && (src.endsWith(".png") || src.endsWith(".jpg"))) {
                    logger.debug("Selected scraped image URL: {}", src);
                    return src;
                } else {
                    logger.warn("Selected URL {} is not a valid image, skipping", src);
                    return null;
                }
            }

            logger.warn("No suitable images found on page: {}", url);
            return null;
        } catch (Exception e) {
            logger.error("Failed to scrape image from {}: {}", url, e.getMessage());
            throw new IOException("Failed to scrape image", e);
        }
    }

    @Override
    public Product updateProduct(Long id, Product product) {
        Optional<Product> existingProduct = productRepository.findById(id);
        if (existingProduct.isPresent()) {
            Product updatedProduct = existingProduct.get();
            updatedProduct.setName(product.getName());
            updatedProduct.setDescription(product.getDescription());
            updatedProduct.setPrice(product.getPrice());
            updatedProduct.setImageUrl(product.getImageUrl());
            updatedProduct.setCategory(product.getCategory());
            updatedProduct.setSubCategory(product.getSubCategory());
            updatedProduct.setInStock(product.getInStock());
            updatedProduct.setDetailsUrl(product.getDetailsUrl());
            return productRepository.save(updatedProduct);
        }
        throw new RuntimeException("Product not found with id: " + id);
    }

    @Override
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Override
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    @Override
    public List<Product> getProductsBySubCategory(String subCategory) {
        return productRepository.findBySubCategory(subCategory);
    }

    @Override
    public List<Product> getProductsByStockStatus(Boolean inStock) {
        return productRepository.findByInStock(inStock);
    }
}