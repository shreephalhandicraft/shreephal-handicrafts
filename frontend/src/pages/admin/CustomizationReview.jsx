import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  ExternalLink,
  Package,
  User,
  Calendar,
  FileText,
  Palette
} from 'lucide-react';

export default function CustomizationReview() {
  const { toast } = useToast();
  const [customizations, setCustomizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [processingActions, setProcessingActions] = useState(new Set());

  useEffect(() => {
    fetchCustomizations();
  }, [filter]);

  const fetchCustomizations = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('order_items_with_customization')
        .select('*')
        .eq('has_customization', true)
        .order('order_date', { ascending: false });
      
      if (filter !== 'all') {
        if (filter === 'pending') {
          query = query.or('approval_status.is.null,approval_status.eq.pending');
        } else {
          query = query.eq('approval_status', filter);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching customizations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customizations',
          variant: 'destructive'
        });
      } else {
        setCustomizations(data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderItemId, customizationRequestId) => {
    setProcessingActions(prev => new Set(prev).add(orderItemId));
    
    try {
      // If no request exists, create one first
      if (!customizationRequestId) {
        const item = customizations.find(c => c.order_item_id === orderItemId);
        
        const { data: newRequest, error: createError } = await supabase
          .from('customization_requests')
          .insert([{
            order_id: item.order_id,
            order_item_id: orderItemId,
            customization_type: item.custom_image_url ? 'image' : 'text',
            customer_requirements: item.customization_data,
            design_files: item.custom_image_url ? {
              files: [{
                url: item.custom_image_url,
                type: 'customer_upload'
              }]
            } : null,
            status: 'approved',
            admin_notes: 'Auto-approved'
          }])
          .select()
          .single();
        
        if (createError) {
          throw createError;
        }
        
        customizationRequestId = newRequest.id;
      } else {
        // Update existing request
        const { error } = await supabase
          .from('customization_requests')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', customizationRequestId);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Approved',
        description: 'Customization request has been approved',
      });
      
      fetchCustomizations();
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve customization',
        variant: 'destructive'
      });
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderItemId);
        return newSet;
      });
    }
  };

  const handleReject = async (orderItemId, customizationRequestId) => {
    const notes = prompt('Reason for rejection (optional):');
    if (notes === null) return; // User cancelled
    
    setProcessingActions(prev => new Set(prev).add(orderItemId));
    
    try {
      if (!customizationRequestId) {
        const item = customizations.find(c => c.order_item_id === orderItemId);
        
        const { error: createError } = await supabase
          .from('customization_requests')
          .insert([{
            order_id: item.order_id,
            order_item_id: orderItemId,
            customization_type: item.custom_image_url ? 'image' : 'text',
            customer_requirements: item.customization_data,
            design_files: item.custom_image_url ? {
              files: [{
                url: item.custom_image_url,
                type: 'customer_upload'
              }]
            } : null,
            status: 'rejected',
            admin_notes: notes || 'Rejected'
          }]);
        
        if (createError) throw createError;
      } else {
        const { error } = await supabase
          .from('customization_requests')
          .update({ 
            status: 'rejected',
            admin_notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', customizationRequestId);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Rejected',
        description: 'Customization request has been rejected',
      });
      
      fetchCustomizations();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject customization',
        variant: 'destructive'
      });
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderItemId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status) => {
    if (!status || status === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      );
    }
    if (status === 'approved') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (status === 'rejected') {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return <Badge>{status}</Badge>;
  };

  const getFilterStats = () => {
    const stats = {
      all: customizations.length,
      pending: customizations.filter(c => !c.approval_status || c.approval_status === 'pending').length,
      approved: customizations.filter(c => c.approval_status === 'approved').length,
      rejected: customizations.filter(c => c.approval_status === 'rejected').length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = getFilterStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Customization Review Queue
        </h1>
        <p className="text-gray-600">
          Review and approve customer customization requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'pending', label: 'Pending', icon: Clock, count: stats.pending },
          { key: 'approved', label: 'Approved', icon: CheckCircle, count: stats.approved },
          { key: 'rejected', label: 'Rejected', icon: XCircle, count: stats.rejected },
          { key: 'all', label: 'All', icon: FileText, count: stats.all },
        ].map(({ key, label, icon: Icon, count }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Customizations List */}
      {customizations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {filter !== 'all' ? filter : ''} customizations found
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? 'All customizations have been reviewed'
                : 'No customizations match this filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customizations.map(item => {
            const isProcessing = processingActions.has(item.order_item_id);
            
            return (
              <Card key={item.order_item_id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">
                        {item.product_name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Order: #{item.order_id.slice(0, 8)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.customer_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.order_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(item.approval_status)}
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Info */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-900">Product Information</h4>
                        {item.product_image && (
                          <img 
                            src={item.product_image} 
                            alt={item.product_name}
                            className="w-full max-w-xs h-48 object-cover rounded-lg border mb-3"
                          />
                        )}
                        <div className="space-y-2 text-sm">
                          {item.sku && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">SKU:</span>
                              <span className="font-medium">{item.sku}</span>
                            </div>
                          )}
                          {item.size_display && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Size:</span>
                              <span className="font-medium">{item.size_display}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Customization Details */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Customization Details</h4>
                      
                      {item.custom_text && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <FileText className="w-4 h-4" />
                            Custom Text:
                          </div>
                          <div className="p-3 bg-gray-50 rounded border">
                            <p className="text-sm">{item.custom_text}</p>
                          </div>
                        </div>
                      )}
                      
                      {item.custom_color && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Palette className="w-4 h-4" />
                            Custom Color:
                          </div>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-lg border-2 shadow-sm"
                              style={{ backgroundColor: item.custom_color }}
                            />
                            <span className="text-sm font-mono">{item.custom_color}</span>
                          </div>
                        </div>
                      )}
                      
                      {item.custom_image_url && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <ImageIcon className="w-4 h-4" />
                            Uploaded Image:
                          </div>
                          <a 
                            href={item.custom_image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Full Size
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={item.custom_image_url} 
                              alt="Customer Upload" 
                              className="w-full h-auto max-h-64 object-contain bg-gray-50"
                            />
                          </div>
                        </div>
                      )}
                      
                      {item.admin_notes && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-sm text-yellow-900">{item.admin_notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {(!item.approval_status || item.approval_status === 'pending') && (
                    <div className="flex gap-3 mt-6 pt-6 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(item.order_item_id, item.customization_request_id)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(item.order_item_id, item.customization_request_id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
