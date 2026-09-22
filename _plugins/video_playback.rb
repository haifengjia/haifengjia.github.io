# frozen_string_literal: true

require "webrick"

# WEBrick treats a matching If-Range as "not modified" and answers 304.
# Chrome sends If-Range while buffering video, then stalls when the body is empty.
module WEBrick
  module HTTPServlet
    class DefaultFileHandler
      def not_modified?(req, res, mtime, etag)
        if (ims = req["if-modified-since"]) && Time.parse(ims) >= mtime
          return true
        end

        if (inm = req["if-none-match"]) &&
           HTTPUtils.split_header_value(inm).member?(res["etag"])
          return true
        end

        false
      end
    end
  end
end

# Jekyll's preview server marks every response no-store. Chrome will not keep
# a video with that header, so playback stops after the first read.
TracePoint.new(:end) do |tp|
  next unless tp.self.name == "Jekyll::Commands::Serve::Servlet"

  tp.disable
  tp.self.class_eval do
    alias_method :__video_do_GET, :do_GET unless method_defined?(:__video_do_GET)

    def do_GET(req, res)
      rtn = __video_do_GET(req, res)
      if req.path.end_with?(".mp4")
        res.header.delete_if { |key, _| key.downcase == "cache-control" }
        res["Cache-Control"] = "public, max-age=0, must-revalidate"
      end
      rtn
    end
  end
end.enable
