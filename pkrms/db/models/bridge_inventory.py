from django.db import models
from django.core.exceptions import ValidationError
from .link import Link

class BridgeInventory(models.Model):
    # id = models.AutoField(primary_key=True,db_column='id')
    year = models.IntegerField(db_column='year')
    admin_code = models.IntegerField(db_column='adminCode')
    link_no = models.CharField(max_length=50,db_column='linkNo')
    bridge_number = models.CharField(max_length=100, db_column='bridgeNumber')
    chainage = models.IntegerField(db_column='chainage')
    drp_from = models.IntegerField(null=True, blank=True, db_column='drpFrom')
    offset_from = models.IntegerField(null=True, blank=True, db_column='offsetFrom')
    bridge_name = models.CharField(max_length=255, db_column='bridgeName')
    bridge_length = models.FloatField(db_column='bridgeLength')
    bridge_type = models.CharField(max_length=100, db_column='bridgeType')
    number_spans = models.FloatField(null=True, blank=True, db_column='numberSpans')
    road_width = models.FloatField(null=True, blank=True, db_column='roadWidth')
    footpath_width_l = models.FloatField(null=True, blank=True, db_column='footpathWidthL')
    footpath_width_r = models.FloatField(null=True, blank=True, db_column='footpathWidthR')
    crossing = models.CharField(max_length=255, null=True, blank=True, db_column='crossing')
    year_construction = models.IntegerField(null=True, blank=True, db_column='yearConstruction')
    bridge_north_deg = models.IntegerField(null=True, blank=True, db_column='bridgeNorthDeg')
    bridge_north_min = models.IntegerField(null=True, blank=True, db_column='bridgeNorthMin')
    bridge_north_sec = models.FloatField(null=True, blank=True, db_column='bridgeNorthSec')
    bridge_east_deg = models.IntegerField(null=True, blank=True, db_column='bridgeEastDeg')
    bridge_east_min = models.IntegerField(null=True, blank=True, db_column='bridgeEastMin')
    bridge_east_sec = models.FloatField(null=True, blank=True, db_column='bridgeEastSec')
    handrails = models.BooleanField(null=True, blank=True, db_column='handrails')
    cond_handrails = models.FloatField(null=True, blank=True, db_column='condHandrails')
    guardrail = models.BooleanField(null=True, blank=True, db_column='guardrail')
    cond_guardrails = models.FloatField(null=True, blank=True, db_column='condGuardrails')
    roadsurface = models.BooleanField(null=True, blank=True, db_column='roadsurface')
    cond_roadsurface = models.FloatField(null=True, blank=True, db_column='condRoadsurface')
    deck = models.BooleanField(null=True, blank=True, db_column='deck')
    cond_deck = models.FloatField(null=True, blank=True, db_column='condDeck')
    deckjoints = models.BooleanField(null=True, blank=True, db_column='deckJoints')
    cond_deckjoints = models.FloatField(null=True, blank=True, db_column='condDeckJoints')
    beam = models.BooleanField(null=True, blank=True, db_column='beam')
    cond_beam = models.FloatField(null=True, blank=True, db_column='condBeam')
    wingwalls = models.BooleanField(null=True, blank=True, db_column='wingWalls')
    cond_wingwalls = models.FloatField(null=True, blank=True, db_column='condWingWalls')
    abutment = models.BooleanField(null=True, blank=True, db_column='abutment')
    cond_abutment = models.FloatField(null=True, blank=True, db_column='condAbutment')
    piers = models.BooleanField(null=True, blank=True, db_column='piers')
    cond_piers = models.FloatField(null=True, blank=True, db_column='condPiers')
    bearings = models.BooleanField(null=True, blank=True, db_column='bearings')
    cond_bearings = models.FloatField(null=True, blank=True, db_column='condBearings')
    foundations = models.BooleanField(null=True, blank=True, db_column='foundations')
    cond_foundations = models.FloatField(null=True, blank=True, db_column='condFoundations')
    stormwaterdrain = models.BooleanField(null=True, blank=True, db_column='stormWaterDrain')
    cond_stormwaterdrain = models.FloatField(null=True, blank=True, db_column='condStormWaterDrain')
    obstruction = models.BooleanField(null=True, blank=True, db_column='obstruction')
    cond_obstruction = models.FloatField(null=True, blank=True, db_column='condObstruction')
    scouring = models.BooleanField(null=True, blank=True, db_column='scouring')
    cond_scouring = models.FloatField(null=True, blank=True, db_column='condScouring')
    analysisbaseyear = models.BooleanField(null=True, blank=True, db_column='analysisBaseYear')
    surveyby = models.CharField(max_length=255, null=True, blank=True, db_column='surveyBy')

    # @classmethod
    # def create_with_admin_code(cls, province_code, kabupaten_code, **kwargs):
       
    #     admin_code = int(f"{province_code}{kabupaten_code:02d}")
    #     return cls(admin_code=admin_code, **kwargs)

    def clean(self):
        required_fields = [
            self.admin_code,
            self.year,
            self.chainage,
            self.link_no,
            self.bridge_number,
            self.bridge_length,
            self.bridge_type
        ]
        if any(field is None for field in required_fields):
            raise ValidationError("All required fields must be filled")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.bridge_number}"
    
    class Meta:
        db_table = 'bridgeinventory'
        verbose_name = 'Bridge Inventory'
        verbose_name_plural = 'Bridge Inventories'
