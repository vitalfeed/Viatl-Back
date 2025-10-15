package com.veterinaire.formulaireveterinaire.serviceimpl;

import com.veterinaire.formulaireveterinaire.DAO.CabinetVeterinaireRepository;
import com.veterinaire.formulaireveterinaire.DAO.OurVeterinaireRepository;
import com.veterinaire.formulaireveterinaire.entity.CabinetVeterinaire;
import com.veterinaire.formulaireveterinaire.entity.OurVeterinaire;
import com.veterinaire.formulaireveterinaire.service.CabinetVeterinaireService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.util.Optional;

@Service
public class CabinetVeterinaireServiceImpl implements CabinetVeterinaireService {

    private static final Logger logger = LoggerFactory.getLogger(CabinetVeterinaireServiceImpl.class);
    private static final DecimalFormat decimalFormat = new DecimalFormat("#");

    private final CabinetVeterinaireRepository cabinetVeterinaireRepository;
    private final OurVeterinaireRepository ourVeterinaireRepository;
    private final HttpClient httpClient;

    public CabinetVeterinaireServiceImpl(CabinetVeterinaireRepository cabinetVeterinaireRepository,
                                         OurVeterinaireRepository ourVeterinaireRepository) {
        this.cabinetVeterinaireRepository = cabinetVeterinaireRepository;
        this.ourVeterinaireRepository = ourVeterinaireRepository;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public void saveFromExcel(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // skip header

                Cell nomVeterinaireCell = row.getCell(0);
                Cell adresseCell = row.getCell(1);
                Cell phoneCell = row.getCell(2);
                Cell matriculeCell = row.getCell(3);

                String matricule = getCellValueAsString(matriculeCell).trim();
                String name = getCellValueAsString(nomVeterinaireCell).trim();
                String address = getCellValueAsString(adresseCell).trim();
                String phone = getCellValueAsString(phoneCell).trim();

                if (matricule.isEmpty() || address.isEmpty() || name.isEmpty()) {
                    logger.warn("Skipping row {}: Missing matricule, name or address", row.getRowNum());
                    continue;
                }

                Optional<OurVeterinaire> optionalVeterinaire = ourVeterinaireRepository.findByMatricule(matricule);
                if (optionalVeterinaire.isEmpty()) {
                    logger.warn("Skipping row {}: matricule {} not found in OurVeterinaire table", row.getRowNum(), matricule);
                    continue;
                }

                Optional<CabinetVeterinaire> optionalCabinet =
                        cabinetVeterinaireRepository.findByNameAndAddress(name, address);

                CabinetVeterinaire cabinet;
                boolean updated = false;

                if (optionalCabinet.isPresent()) {
                    cabinet = optionalCabinet.get();

                    if ((cabinet.getPhone() == null || cabinet.getPhone().isEmpty()) && !phone.isEmpty()) {
                        cabinet.setPhone(phone);
                        updated = true;
                    }

                    if (cabinet.getLatitude() == null || cabinet.getLongitude() == null) {
                        String[] latLong = geocodeSmart(address);
                        if (latLong != null) {
                            cabinet.setLatitude(latLong[0]);
                            cabinet.setLongitude(latLong[1]);
                            updated = true;
                        }
                    }

                    if (updated) {
                        cabinetVeterinaireRepository.save(cabinet);
                        logger.info("✅ Updated existing cabinet {} with new data", name);
                    } else {
                        logger.info("ℹ️ No updates needed for existing cabinet {}", name);
                    }

                } else {
                    cabinet = new CabinetVeterinaire();
                    cabinet.setName(name);
                    cabinet.setAddress(address);
                    cabinet.setPhone(!phone.isEmpty() ? phone : null);
                    cabinet.setFeatured(false);
                    cabinet.setType("BOUTIQUE");

                    String[] latLong = geocodeSmart(address);
                    if (latLong != null) {
                        cabinet.setLatitude(latLong[0]);
                        cabinet.setLongitude(latLong[1]);
                    } else {
                        // Fallback sur le Bardo ou Tunis
                        cabinet.setLatitude("36.8090");
                        cabinet.setLongitude("10.1403");
                        logger.warn("⚠️ Geocoding failed for '{}', fallback to Bardo center", address);
                    }

                    cabinetVeterinaireRepository.save(cabinet);
                    logger.info("✅ Saved new cabinet {} for matricule {}", name, matricule);
                }

                // Respect Nominatim : 1 requête/seconde
                Thread.sleep(1000);
            }
        } catch (IOException e) {
            logger.error("❌ Error processing Excel file: {}", e.getMessage());
            throw new Exception("Erreur lors du traitement du fichier Excel", e);
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return decimalFormat.format(cell.getNumericCellValue()).trim();
            default:
                return "";
        }
    }

    // --- LOGIQUE DE GÉOCODAGE INTELLIGENT ---

    private String[] geocodeSmart(String address) {
        String cleaned = normalizeAddress(address);

        // Trois tentatives progressives
        String[] attempts = {
                cleaned,
                cleaned.replaceAll("^[0-9]+,?", ""),        // sans numéro de rue
                "Le Bardo, Tunis, Tunisia"                  // fallback ville
        };

        for (String a : attempts) {
            String[] result = tryGeocode(a);
            if (result != null) return result;
        }
        logger.error("❌ All geocoding attempts failed for: {}", address);
        return null;
    }

    private String normalizeAddress(String address) {
        return address
                .replaceAll("[,–/]", " ")    // remplace la ponctuation
                .replaceAll("\\s+", " ")     // espaces multiples
                .replace("Cité", "")
                .replace("Résidence", "")
                .trim() + ", Tunis, Tunisia";
    }

    private String[] tryGeocode(String address) {
        try {
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?q=" +
                    encodedAddress + "&format=json&limit=1&countrycodes=tn";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "vitalfeed-veterinaire-app/1.0 (contact@vitalfeed.com)")
                    .header("Accept-Language", "fr")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JSONArray jsonArray = new JSONArray(response.body());
                if (jsonArray.isEmpty()) {
                    logger.warn("⚠️ No results found for address: {}", address);
                    return null;
                }

                JSONObject result = jsonArray.getJSONObject(0);
                String lat = result.getString("lat");
                String lon = result.getString("lon");

                logger.info("📍 Geocoding success for '{}' → {}, {}", address, lat, lon);
                return new String[]{lat, lon};
            } else {
                logger.warn("⚠️ Nominatim returned status {} for {}", response.statusCode(), address);
            }

        } catch (Exception e) {
            logger.warn("⚠️ Geocoding error for '{}': {}", address, e.getMessage());
        }
        return null;
    }
}
