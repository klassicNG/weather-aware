"""
Serializers for Weather-Aware Truck Routing API
"""

from rest_framework import serializers


class RouteAnalyzeRequestSerializer(serializers.Serializer):
    origin = serializers.CharField(
        required=True,
        help_text="Origin city/address (e.g. 'Chicago, IL') or coordinates 'lat, lon'"
    )
    destination = serializers.CharField(
        required=True,
        help_text="Destination city/address (e.g. 'Denver, CO') or coordinates 'lat, lon'"
    )
    departure_time = serializers.CharField(
        required=False,
        default="",
        allow_blank=True,
        help_text="ISO 8601 departure timestamp (e.g. '2026-10-22T08:00:00Z')"
    )
    load_weight = serializers.FloatField(
        required=False,
        default=0.0,
        min_value=0.0,
        help_text="Truck load weight in lbs (e.g. 45000)"
    )
    checkpoint_interval = serializers.FloatField(
        required=False,
        default=50.0,
        help_text="Sampling interval in miles (10, 25, or 50 miles, default 50)"
    )

    def validate_checkpoint_interval(self, value):
        if value not in (10.0, 25.0, 50.0):
            # Allow fallback to nearest or default 50
            return 50.0
        return value
