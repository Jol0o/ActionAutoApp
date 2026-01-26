import { jsPDF } from 'jspdf';
import { Shipment } from '@/types/transportation';

/**
 * Generate and download a professional PDF of shipment details
 * Professional design by Action Auto Utah - Powered By Supra AI
 */
export const generateShipmentPDF = async (shipment: Shipment) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Get quote data
    const quote = shipment.quoteId || shipment.preservedQuoteData;
    const vehicle = quote?.vehicleId;
    const vehicleName = vehicle 
        ? `${vehicle.year} ${vehicle.make} ${vehicle.modelName}`
        : quote?.vehicleName || 'N/A';

    // Professional color palette
    const colors = {
        primary: '#16a34a',      // Green (matching logo)
        darkGreen: '#15803d',    // Dark green
        navy: '#1e3a8a',         // Navy blue
        darkGray: '#1f2937',     // Dark gray
        mediumGray: '#6b7280',   // Medium gray
        lightGray: '#f3f4f6',    // Light gray
        success: '#10b981',      // Success green
        text: '#111827'          // Near black
    };

    // Helper function to format dates
    const formatDate = (date?: string) => {
        if (!date) return 'Not Scheduled';
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Available for Pickup': return '#f59e0b';
            case 'Delivered': return '#10b981';
            case 'Cancelled': return '#ef4444';
            case 'In-Route': return '#3b82f6';
            case 'Dispatched': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    let yPosition = 20;

    // ============================================
    // PROFESSIONAL HEADER WITH LOGO
    // ============================================
    
    // Green header bar
    pdf.setFillColor(22, 163, 74); // Primary green
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Company name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ACTION AUTO UTAH', 15, 20);
    
    // Tagline
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('POWERED BY SUPRA AI', 15, 25);
    
    // Divider line
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.3);
    pdf.line(15, 32, pageWidth - 15, 32);
    
    // Document title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SHIPMENT DOCUMENTATION', 15, 39);
    
    // Document date - Right aligned
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    pdf.text(`Issue Date: ${currentDate}`, pageWidth - 15, 39, { align: 'right' });

    yPosition = 55;

    // ============================================
    // TRACKING & STATUS SECTION
    // ============================================
    pdf.setFillColor(243, 244, 246); // Light gray background
    pdf.rect(15, yPosition, pageWidth - 30, 20, 'F');
    
    // Tracking number
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TRACKING NUMBER:', 20, yPosition + 7);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(shipment.trackingNumber || 'Not Assigned', 20, yPosition + 14);
    
    // Status badge - Right side
    const statusColor = getStatusColor(shipment.status);
    const statusRgb = hexToRgb(statusColor);
    pdf.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
    
    const statusText = shipment.status.toUpperCase();
    const statusWidth = pdf.getTextWidth(statusText) + 10;
    pdf.roundedRect(pageWidth - 15 - statusWidth, yPosition + 5, statusWidth, 10, 2, 2, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(statusText, pageWidth - 15 - statusWidth / 2, yPosition + 11.5, { align: 'center' });

    yPosition += 30;

    // ============================================
    // CUSTOMER INFORMATION - FORMAL TABLE
    // ============================================
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CUSTOMER INFORMATION', 15, yPosition);
    
    yPosition += 3;
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(1);
    pdf.line(15, yPosition, 75, yPosition);
    
    yPosition += 8;
    
    // Table-like structure
    const customerData = [
        { label: 'Full Name', value: `${quote?.firstName || ''} ${quote?.lastName || ''}`.trim() || 'N/A' },
        { label: 'Email Address', value: quote?.email || 'N/A' },
        { label: 'Phone Number', value: quote?.phone || 'N/A' },
    ];
    
    customerData.forEach(item => {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
        
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.label.toUpperCase(), 20, yPosition);
        
        pdf.setTextColor(31, 41, 55);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.value, 75, yPosition);
        
        yPosition += 10;
    });

    yPosition += 5;

    // ============================================
    // VEHICLE INFORMATION - PROFESSIONAL LAYOUT
    // ============================================
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VEHICLE INFORMATION', 15, yPosition);
    
    yPosition += 3;
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(1);
    pdf.line(15, yPosition, 75, yPosition);
    
    yPosition += 8;

    // Vehicle image section
    if (quote?.vehicleImage) {
        try {
            const imgData = await loadImageAsBase64(quote.vehicleImage);
            
            // Add border around image
            pdf.setDrawColor(209, 213, 219);
            pdf.setLineWidth(0.5);
            pdf.rect(15, yPosition, 90, 60);
            
            pdf.addImage(imgData, 'JPEG', 16, yPosition + 1, 88, 58);
            
            // Vehicle details - Right side
            const detailsX = 110;
            let detailsY = yPosition + 5;
            
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(31, 41, 55);
            pdf.text(vehicleName, detailsX, detailsY);
            
            detailsY += 12;
            
            const vehicleDetails = [
                { label: 'VIN Number', value: vehicle?.vin || quote?.vin || 'N/A' },
                { label: 'Stock Number', value: vehicle?.stockNumber || quote?.stockNumber || 'N/A' },
                { label: 'Location', value: quote?.vehicleLocation || 'N/A' }
            ];
            
            vehicleDetails.forEach(detail => {
                pdf.setFillColor(249, 250, 251);
                pdf.rect(detailsX, detailsY - 4, 85, 8, 'F');
                
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(107, 114, 128);
                pdf.text(detail.label.toUpperCase(), detailsX + 2, detailsY);
                
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(31, 41, 55);
                pdf.text(detail.value, detailsX + 2, detailsY + 5);
                
                detailsY += 11;
            });
            
            yPosition += 68;
        } catch (error) {
            console.error('Error loading vehicle image:', error);
            // Fallback without image
            const vehicleDetails = [
                { label: 'Vehicle', value: vehicleName },
                { label: 'VIN Number', value: vehicle?.vin || quote?.vin || 'N/A' },
                { label: 'Stock Number', value: vehicle?.stockNumber || quote?.stockNumber || 'N/A' },
                { label: 'Location', value: quote?.vehicleLocation || 'N/A' }
            ];
            
            vehicleDetails.forEach(detail => {
                pdf.setFillColor(249, 250, 251);
                pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
                
                pdf.setTextColor(107, 114, 128);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.text(detail.label.toUpperCase(), 20, yPosition);
                
                pdf.setTextColor(31, 41, 55);
                pdf.setFont('helvetica', 'normal');
                pdf.text(detail.value, 75, yPosition);
                
                yPosition += 10;
            });
            
            yPosition += 5;
        }
    } else {
        const vehicleDetails = [
            { label: 'Vehicle', value: vehicleName },
            { label: 'VIN Number', value: vehicle?.vin || quote?.vin || 'N/A' },
            { label: 'Stock Number', value: vehicle?.stockNumber || quote?.stockNumber || 'N/A' },
            { label: 'Location', value: quote?.vehicleLocation || 'N/A' }
        ];
        
        vehicleDetails.forEach(detail => {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
            
            pdf.setTextColor(107, 114, 128);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(detail.label.toUpperCase(), 20, yPosition);
            
            pdf.setTextColor(31, 41, 55);
            pdf.setFont('helvetica', 'normal');
            pdf.text(detail.value, 75, yPosition);
            
            yPosition += 10;
        });
        
        yPosition += 5;
    }

    // ============================================
    // ROUTE INFORMATION - FORMAL
    // ============================================
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ROUTE INFORMATION', 15, yPosition);
    
    yPosition += 3;
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(1);
    pdf.line(15, yPosition, 75, yPosition);
    
    yPosition += 10;

    // Origin
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
    
    pdf.setFillColor(22, 163, 74);
    pdf.circle(20, yPosition, 2.5, 'F');
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ORIGIN', 27, yPosition - 1);
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(shipment.origin, 27, yPosition + 4);
    
    yPosition += 12;

    // Connection line
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(1);
    pdf.line(20, yPosition - 10, 20, yPosition + 2);
    
    // Destination
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
    
    pdf.setFillColor(239, 68, 68);
    pdf.circle(20, yPosition, 2.5, 'F');
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESTINATION', 27, yPosition - 1);
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(shipment.destination, 27, yPosition + 4);
    
    yPosition += 17;

    // ============================================
    // SHIPMENT TIMELINE - PROFESSIONAL TABLE
    // ============================================
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SHIPMENT TIMELINE', 15, yPosition);
    
    yPosition += 3;
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(1);
    pdf.line(15, yPosition, 75, yPosition);
    
    yPosition += 8;

    const timelineData = [
        { label: 'Requested Pickup Date', date: formatDate(shipment.requestedPickupDate) },
        { label: 'Scheduled Pickup Date', date: formatDate(shipment.scheduledPickup) },
        { label: 'Actual Pickup Date', date: formatDate(shipment.pickedUp) },
        { label: 'Scheduled Delivery Date', date: formatDate(shipment.scheduledDelivery) },
        { label: 'Actual Delivery Date', date: formatDate(shipment.delivered) }
    ];

    timelineData.forEach((item, index) => {
        const fillColor = index % 2 === 0 ? 249 : 243;
        pdf.setFillColor(fillColor, 250, 251);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
        
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.label, 20, yPosition);
        
        pdf.setTextColor(31, 41, 55);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.date, pageWidth - 20, yPosition, { align: 'right' });
        
        yPosition += 10;
    });

    yPosition += 5;

    // ============================================
    // TRANSPORT DETAILS & PRICING - FORMAL
    // ============================================
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TRANSPORT DETAILS', 15, yPosition);
    
    yPosition += 3;
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(1);
    pdf.line(15, yPosition, 75, yPosition);
    
    yPosition += 8;

    const transportDetails = [
        { label: 'Transport Type', value: quote?.enclosedTrailer ? 'Enclosed Trailer' : 'Open Trailer' },
        { label: 'Vehicle Condition', value: quote?.vehicleInoperable ? 'Inoperable' : 'Operable' },
        { label: 'Distance', value: `${quote?.miles || 'N/A'} miles` },
        { label: 'Number of Units', value: `${quote?.units || 'N/A'}` }
    ];

    transportDetails.forEach((item, index) => {
        const fillColor = index % 2 === 0 ? 249 : 243;
        pdf.setFillColor(fillColor, 250, 251);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
        
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.label, 20, yPosition);
        
        pdf.setTextColor(31, 41, 55);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.value, pageWidth - 20, yPosition, { align: 'right' });
        
        yPosition += 10;
    });

    yPosition += 10;

    // Pricing section - Professional box
    pdf.setFillColor(22, 163, 74);
    pdf.rect(15, yPosition, pageWidth - 30, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL TRANSPORT RATE', 20, yPosition + 7);
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${quote?.rate?.toLocaleString() || 'N/A'}`, 20, yPosition + 15);
    
    pdf.setFontSize(10);
    pdf.text('USD', pageWidth - 20, yPosition + 15, { align: 'right' });

    // ============================================
    // PROFESSIONAL FOOTER
    // ============================================
    const footerY = pageHeight - 25;
    
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(15, footerY, pageWidth - 15, footerY);
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Company info
    pdf.text('Action Auto Utah', pageWidth / 2, footerY + 5, { align: 'center' });
    pdf.setFontSize(7);
    pdf.text('Powered By Supra AI', pageWidth / 2, footerY + 9, { align: 'center' });
    
    // Document info
    pdf.setFontSize(7);
    pdf.text(`Document ID: ${shipment._id}`, pageWidth / 2, footerY + 14, { align: 'center' });
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, footerY + 18, { align: 'center' });

    // ============================================
    // SAVE PDF
    // ============================================
    const fileName = `ActionAutoUtah_Shipment_${shipment.trackingNumber || shipment._id}.pdf`;
    pdf.save(fileName);
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }
            
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}