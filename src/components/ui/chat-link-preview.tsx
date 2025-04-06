import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ChatLinkPreviewProps = {
  url: string;
};

export const ChatLinkPreview = ({ url }: ChatLinkPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<{
    title?: string;
    description?: string;
    image?: string;
    url: string;
    favicon?: string;
  }>({ url });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Generate preview image URL from microlink API
    const previewUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    
    fetch(previewUrl)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setPreviewData({
            title: data.data.title || '',
            description: data.data.description || '',
            image: data.data.image?.url || null,
            favicon: data.data.logo?.url || `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128`,
            url
          });
        }
      })
      .catch(err => console.error('Error fetching link preview:', err))
      .finally(() => setIsLoading(false));
  }, [url]);

  // Extract hostname for display
  const hostname = (() => {
    try {
      const { hostname } = new URL(url);
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  })();

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            height: 'auto',
            transition: {
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -10, 
            height: 0,
            transition: {
              duration: 0.2
            }
          }}
          className="mt-2 overflow-hidden"
        >
          <div className="bg-gray-100 rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="loaded"
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1
            }
          }}
          className="mt-2 max-w-[300px]"
        >
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block no-underline"
          >
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              {/* Image Section */}
              {previewData.image && !imageError && (
                <div className="w-full h-36 bg-gray-50 relative">
                  <img 
                    src={previewData.image} 
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Content Section */}
              <div className="p-3">
                {/* Website Info Row with Favicon */}
                <div className="flex items-center gap-2 mb-2">
                  {previewData.favicon && (
                    <img 
                      src={previewData.favicon} 
                      alt=""
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  <span className="text-xs text-gray-500 truncate">
                    {hostname}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">
                  {previewData.title || url}
                </h4>
                
                {/* Description (if available) */}
                {previewData.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {previewData.description}
                  </p>
                )}
              </div>
            </div>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
