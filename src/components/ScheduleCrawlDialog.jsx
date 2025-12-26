import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, Calendar } from "lucide-react";

export default function ScheduleCrawlDialog({ site, open, onOpenChange, onSave }) {
  const [enabled, setEnabled] = useState(site?.schedule_enabled || false);
  const [frequency, setFrequency] = useState(site?.schedule_frequency || "weekly");
  const [time, setTime] = useState(site?.schedule_time || "09:00");

  useEffect(() => {
    if (site) {
      setEnabled(site.schedule_enabled || false);
      setFrequency(site.schedule_frequency || "weekly");
      setTime(site.schedule_time || "09:00");
    }
  }, [site]);

  const handleSave = () => {
    onSave({
      schedule_enabled: enabled,
      schedule_frequency: frequency,
      schedule_time: time,
    });
  };

  const getNextCrawlPreview = () => {
    if (!enabled) return "Disabled";
    
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    
    if (frequency === "daily") {
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next.toLocaleString();
    } else if (frequency === "weekly") {
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      while (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      return next.toLocaleString();
    } else if (frequency === "monthly") {
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next.toLocaleString();
    }
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Crawls</DialogTitle>
          <DialogDescription>
            Configure automatic crawls for {site?.domain}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Scheduled Crawls</Label>
              <p className="text-sm text-slate-500">Automatically crawl this site</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Daily
                      </div>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Weekly
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Monthly
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time of Day</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Next scheduled crawl:</p>
                <p className="text-sm text-slate-600">{getNextCrawlPreview()}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800">
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}