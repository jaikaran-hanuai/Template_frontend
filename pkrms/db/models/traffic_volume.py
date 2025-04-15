from django.db import models
from django.forms import ValidationError
from .link import Link

class TrafficVolume(models.Model):
    id = models.AutoField(primary_key=True,db_column='id')
    year = models.IntegerField(null=True, blank=True, db_column='year')
    admin_code = models.IntegerField(db_column='adminCode')
    link_no = models.CharField(max_length=50,db_column='linkNo')
    marketday = models.BooleanField(null=True, blank=True, db_column='marketDay')
    trafficcount = models.CharField(max_length=255,null=True, blank=True, db_column='trafficCount')
    journeytime = models.FloatField(null=True, blank=True, db_column='journeyTime')
    aadt_mc = models.IntegerField(null=True, blank=True, db_column='aadtMc')
    aadt_car = models.IntegerField(null=True, blank=True, db_column='aadtCar')
    aadt_pickup = models.IntegerField(null=True, blank=True, db_column='aadtPickup')
    aadt_microtruck = models.IntegerField(null=True, blank=True, db_column='aadtMicroTruck')
    aadt_small_bus = models.IntegerField(null=True, blank=True, db_column='aadtSmallBus')
    aadt_large_bus = models.IntegerField(null=True, blank=True, db_column='aadtLargeBus')
    aadt_small_truck = models.IntegerField(null=True, blank=True, db_column='aadtSmallTruck')
    aadt_medium_truck = models.IntegerField(null=True, blank=True, db_column='aadtMediumTruck')
    aadt_large_truck = models.IntegerField(null=True, blank=True, db_column='aadtLargeTruck')
    aadt_truck_trailer = models.IntegerField(null=True, blank=True, db_column='aadtTruckTrailer')
    aadt_semi_trailer = models.IntegerField(null=True, blank=True, db_column='aadtSemiTrailer')
    analysisbaseyear = models.BooleanField(null=True, blank=True, db_column='analysisBaseYear')
    surveyby = models.FloatField(null=True, blank=True, db_column='surveyBy')

    # @classmethod
    # def create_with_admin_code(cls, province_code, kabupaten_code, **kwargs):
        
    #     admin_code = int(f"{province_code}{kabupaten_code:02d}")
    #     return cls(admin_code=admin_code, **kwargs)
    
    def clean(self):
        required_fields = [
            self.admin_code,
            self.link_no
        ]
        if any(field is None for field in required_fields):
            raise ValidationError("All required fields must be filled")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.admin_code}"
    
    class Meta:
        db_table = 'trafficvolume'
        verbose_name = 'Trafficvolume'
        verbose_name_plural = 'Trafficvolumes'
